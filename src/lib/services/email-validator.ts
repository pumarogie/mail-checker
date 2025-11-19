import { promises as dns } from 'dns';
import { 
  EmailValidationResult, 
  DomainInfo, 
  ValidationOptions, 
  MXRecord 
} from '@/types/email';
import { 
  EMAIL_PATTERNS, 
  API_CONFIG, 
  ERROR_CODES, 
  MESSAGES 
} from '@/lib/constants';
import { 
  ValidationError, 
  AppError 
} from '@/lib/utils/errors';

export class EmailValidatorService {
  private dnsCache = new Map<string, { data: MXRecord[]; timestamp: number }>();
  private readonly cacheMaxAge = 5 * 60 * 1000;

  constructor(private options: ValidationOptions = { check_mx: true, check_smtp: false }) {}

  async validateEmail(email: string): Promise<EmailValidationResult> {
    const startTime = Date.now();
    
    try {
      const normalizedEmail = this.sanitizeEmail(email);
      
      const formatValid = this.validateFormat(normalizedEmail);
      if (!formatValid) {
        return this.createFailedResult(
          normalizedEmail,
          'Invalid email format',
          { format: false, domain: false, mx_records: 0 },
          startTime
        );
      }

      const domain = this.extractDomain(normalizedEmail);
      
      const domainInfo = await this.validateDomain(domain);
      
      const deliverable = this.determineDeliverability(domainInfo);
      
      return {
        email: normalizedEmail,
        valid: domainInfo.exists && domainInfo.mx_count > 0,
        deliverable,
        domain_info: domainInfo,
        reason: this.getValidationReason(domainInfo),
        checks: {
          format: true,
          domain: domainInfo.exists,
          mx_records: domainInfo.mx_count,
          smtp: this.options.check_smtp ? await this.checkSMTP(domainInfo) : undefined,
        },
        validation_time_ms: Date.now() - startTime,
      };
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        'api_error',
        ERROR_CODES.DNS_RESOLUTION_FAILED,
        `Email validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async validateBatch(
    emails: string[], 
    options?: { maxConcurrent?: number; delayMs?: number }
  ): Promise<EmailValidationResult[]> {
    const { maxConcurrent = 5, delayMs = 100 } = options || {};
    const results: EmailValidationResult[] = [];
    
    for (let i = 0; i < emails.length; i += maxConcurrent) {
      const chunk = emails.slice(i, i + maxConcurrent);
      
      const chunkPromises = chunk.map(async (email) => {
        try {
          return await this.validateEmail(email);
        } catch (error) {
          return this.createFailedResult(
            email,
            error instanceof Error ? error.message : 'Validation failed',
            { format: false, domain: false, mx_records: 0 },
            Date.now()
          );
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      if (i + maxConcurrent < emails.length && delayMs > 0) {
        await this.delay(delayMs);
      }
    }
    
    return results;
  }

  private sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private validateFormat(email: string): boolean {
    return EMAIL_PATTERNS.BASIC_FORMAT.test(email);
  }

  private extractDomain(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new ValidationError('Invalid email format - missing domain', 'email');
    }
    return parts[1];
  }

  private async validateDomain(domain: string): Promise<DomainInfo> {
    const cached = this.dnsCache.get(domain);
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return this.createDomainInfo(domain, cached.data, true);
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('DNS lookup timeout')), API_CONFIG.TIMEOUTS.DNS_LOOKUP_MS);
      });

      const mxPromise = dns.resolveMx(domain);
      const mxRecords = await Promise.race([mxPromise, timeoutPromise]);
      
      this.dnsCache.set(domain, { data: mxRecords, timestamp: Date.now() });
      
      this.cleanupCache();
      
      return this.createDomainInfo(domain, mxRecords, true);
      
    } catch (error) {
      this.dnsCache.set(domain, { data: [], timestamp: Date.now() });
      
      if (error instanceof Error && error.message === 'DNS lookup timeout') {
        throw new AppError(
          'api_error',
          ERROR_CODES.TIMEOUT_ERROR,
          'DNS lookup timeout',
          504
        );
      }
      
      return this.createDomainInfo(domain, [], false);
    }
  }

  private createDomainInfo(domain: string, mxRecords: MXRecord[], exists: boolean): DomainInfo {
    return {
      domain,
      exists,
      mx_records: mxRecords,
      mx_count: mxRecords.length,
    };
  }

  private determineDeliverability(domainInfo: DomainInfo): 'deliverable' | 'undeliverable' | 'unknown' {
    if (!domainInfo.exists) {
      return 'undeliverable';
    }
    
    if (domainInfo.mx_count === 0) {
      return 'undeliverable';
    }
    
    if (domainInfo.mx_count > 0) {
      return 'deliverable';
    }
    
    return 'unknown';
  }

  private getValidationReason(domainInfo: DomainInfo): string {
    if (!domainInfo.exists) {
      return `Domain '${domainInfo.domain}' does not exist`;
    }
    
    if (domainInfo.mx_count === 0) {
      return `Domain '${domainInfo.domain}' has no MX records`;
    }
    
    if (domainInfo.mx_count > 0) {
      return MESSAGES.SUCCESS.EMAIL_VALID;
    }
    
    return 'Unable to determine email deliverability';
  }

  private async checkSMTP(domainInfo: DomainInfo): Promise<boolean> {
    return domainInfo.mx_count > 0;
  }

  private createFailedResult(
    email: string,
    reason: string,
    checks: { format: boolean; domain: boolean; mx_records: number },
    startTime: number
  ): EmailValidationResult {
    const domain = email.includes('@') ? email.split('@')[1] : '';
    
    return {
      email,
      valid: false,
      deliverable: 'undeliverable',
      domain_info: {
        domain,
        exists: false,
        mx_records: [],
        mx_count: 0,
      },
      reason,
      checks: {
        ...checks,
        smtp: undefined,
      },
      validation_time_ms: Date.now() - startTime,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [domain, entry] of this.dnsCache.entries()) {
      if (now - entry.timestamp > this.cacheMaxAge) {
        this.dnsCache.delete(domain);
      }
    }
  }

  clearCache(): void {
    this.dnsCache.clear();
  }

  getCacheStats(): { size: number; maxAge: number } {
    return {
      size: this.dnsCache.size,
      maxAge: this.cacheMaxAge,
    };
  }
}