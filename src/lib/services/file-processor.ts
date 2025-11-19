import * as XLSX from "xlsx";
import {
  FileProcessingResult,
  BatchValidationResult,
  SupportedFileType,
} from "@/types/email";
import { FILE_LIMITS, EMAIL_PATTERNS, ERROR_CODES } from "@/lib/constants";
import { createFileError, AppError } from "@/lib/utils/errors";
import { EmailValidatorService } from "./email-validator";

export class FileProcessorService {
  private emailValidator: EmailValidatorService;

  constructor() {
    this.emailValidator = new EmailValidatorService();
  }

  async processFile(file: File): Promise<FileProcessingResult> {
    const startTime = Date.now();

    try {
      this.validateFileSize(file);

      const fileType = this.validateFileType(file);

      const buffer = Buffer.from(await file.arrayBuffer());

      const emails = await this.extractEmails(buffer, fileType);

      const uniqueEmails = this.deduplicateEmails(emails);

      if (uniqueEmails.length === 0) {
        throw createFileError("empty");
      }

      const limitedEmails = this.limitEmails(uniqueEmails);

      return {
        emails: limitedEmails,
        file_info: {
          name: file.name,
          size: file.size,
          type: fileType,
          mime_type: file.type,
        },
        extraction_info: {
          total_extracted: emails.length,
          duplicates_removed: emails.length - uniqueEmails.length,
          processing_time_ms: Date.now() - startTime,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "api_error",
        ERROR_CODES.EXTRACTION_FAILED,
        `File processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
      );
    }
  }

  async processAndValidateFile(file: File): Promise<BatchValidationResult> {
    const startTime = Date.now();

    try {
      const fileResult = await this.processFile(file);

      const validationResults = await this.emailValidator.validateBatch(
        fileResult.emails,
        { maxConcurrent: 5, delayMs: 100 },
      );

      const endTime = Date.now();

      const validCount = validationResults.filter((r) => r.valid).length;
      const invalidCount = validationResults.length - validCount;

      return {
        total_count: validationResults.length,
        valid_count: validCount,
        invalid_count: invalidCount,
        results: validationResults,
        file_info: fileResult.file_info,
        processing_stats: {
          started_at: startTime,
          completed_at: endTime,
          processing_time_ms: endTime - startTime,
          truncated:
            fileResult.emails.length === FILE_LIMITS.MAX_EMAILS_FREE_TIER,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "api_error",
        ERROR_CODES.INTERNAL_ERROR,
        `Batch validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
      );
    }
  }

  private validateFileSize(file: File): void {
    const maxSizeBytes = FILE_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw createFileError("size");
    }
  }

  private validateFileType(file: File): SupportedFileType {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (fileName.endsWith(".xlsx")) {
      return "xlsx";
    }
    if (fileName.endsWith(".xls")) {
      return "xls";
    }
    if (fileName.endsWith(".csv")) {
      return "csv";
    }

    if (FILE_LIMITS.MIME_TYPES.xlsx.some((type) => mimeType.includes(type))) {
      return "xlsx";
    }
    if (FILE_LIMITS.MIME_TYPES.xls.some((type) => mimeType.includes(type))) {
      return "xls";
    }
    if (FILE_LIMITS.MIME_TYPES.csv.some((type) => mimeType.includes(type))) {
      return "csv";
    }

    throw createFileError(
      "format",
      "Please upload Excel (.xlsx, .xls) or CSV files.",
    );
  }

  private async extractEmails(
    buffer: Buffer,
    fileType: SupportedFileType,
  ): Promise<string[]> {
    switch (fileType) {
      case "xlsx":
      case "xls":
      case "csv":
        return this.extractEmailsFromSpreadsheet(buffer);
      default:
        throw createFileError("format");
    }
  }

  private extractEmailsFromSpreadsheet(buffer: Buffer): string[] {
    try {
      const workbook = XLSX.read(buffer, {
        type: "buffer",
        cellText: false,
        cellHTML: false,
      });

      let allEmails: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];

        const csvData = XLSX.utils.sheet_to_csv(sheet);

        const emails = this.extractEmailsFromText(csvData);
        allEmails = allEmails.concat(emails);
      }

      return allEmails;
    } catch (error) {
      throw createFileError(
        "extraction",
        `Failed to parse spreadsheet: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private extractEmailsFromText(text: string): string[] {
    const matches = text.match(EMAIL_PATTERNS.EXTRACTION);
    return matches || [];
  }

  private deduplicateEmails(emails: string[]): string[] {
    const normalized = emails.map((email) => email.toLowerCase().trim());

    const unique = [...new Set(normalized)];

    return unique.filter((email) => {
      return (
        email.length > 5 &&
        email.includes("@") &&
        EMAIL_PATTERNS.BASIC_FORMAT.test(email) &&
        !email.includes("..") &&
        !email.startsWith("@") &&
        !email.endsWith("@")
      );
    });
  }

  private limitEmails(emails: string[]): string[] {
    const maxEmails = FILE_LIMITS.MAX_EMAILS_FREE_TIER;

    if (emails.length <= maxEmails) {
      return emails;
    }

    return emails.slice(0, maxEmails);
  }

  static getSupportedFormats() {
    return {
      formats: FILE_LIMITS.SUPPORTED_FORMATS,
      mime_types: FILE_LIMITS.MIME_TYPES,
      max_size_mb: FILE_LIMITS.MAX_FILE_SIZE_MB,
      max_emails: FILE_LIMITS.MAX_EMAILS_FREE_TIER,
    };
  }

  static isFileSupported(file: File): boolean {
    try {
      const processor = new FileProcessorService();
      processor.validateFileType(file);
      return true;
    } catch {
      return false;
    }
  }

  static getFileType(file: File): SupportedFileType | null {
    try {
      const processor = new FileProcessorService();
      return processor.validateFileType(file);
    } catch {
      return null;
    }
  }
}
