export const API_CONFIG = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    BURST_LIMIT: 10,
  },
  TIMEOUTS: {
    DNS_LOOKUP_MS: 5000,
    SMTP_CHECK_MS: 10000,
    FILE_PROCESSING_MS: 30000,
  }
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_EMAILS_PER_BATCH: 1000,
  MAX_EMAILS_FREE_TIER: 100,
  SUPPORTED_FORMATS: ['xlsx', 'xls', 'csv'] as const,
  MIME_TYPES: {
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    xls: ['application/vnd.ms-excel'],
    csv: ['text/csv', 'application/csv'],
  }
} as const;

export const EMAIL_PATTERNS = {
  BASIC_FORMAT: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EXTRACTION: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  DOMAIN_PART: /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
} as const;

export const ERROR_CODES = {
  INVALID_EMAIL_FORMAT: 'invalid_email_format',
  DOMAIN_NOT_FOUND: 'domain_not_found',
  NO_MX_RECORDS: 'no_mx_records',
  SMTP_UNREACHABLE: 'smtp_unreachable',
  FILE_TOO_LARGE: 'file_too_large',
  UNSUPPORTED_FORMAT: 'unsupported_format',
  NO_EMAILS_FOUND: 'no_emails_found',
  EXTRACTION_FAILED: 'extraction_failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INTERNAL_ERROR: 'internal_error',
  TIMEOUT_ERROR: 'timeout_error',
  DNS_RESOLUTION_FAILED: 'dns_resolution_failed',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const BATCH_CONFIG = {
  CHUNK_SIZE: 5,
  DELAY_BETWEEN_CHUNKS_MS: 100,
  MAX_CONCURRENT_DNS_LOOKUPS: 10,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 1000,
} as const;

export const CACHE_CONFIG = {
  DNS_TTL_SECONDS: 300,
  RATE_LIMIT_WINDOW_SECONDS: 60,
  MAX_CACHE_SIZE: 1000,
} as const;

export const MESSAGES = {
  SUCCESS: {
    EMAIL_VALID: 'Email address is valid and deliverable',
    BATCH_COMPLETED: 'Batch validation completed successfully',
  },
  ERROR: {
    INVALID_REQUEST: 'The request was invalid or malformed',
    EMAIL_REQUIRED: 'Email address is required',
    FILE_REQUIRED: 'File is required',
    INVALID_EMAIL: 'Invalid email format',
    DOMAIN_ERROR: 'Domain does not exist or has no MX records',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    UNSUPPORTED_FILE: 'File format is not supported',
    NO_EMAILS_EXTRACTED: 'No email addresses found in the uploaded file',
    RATE_LIMITED: 'Too many requests. Please try again later',
    INTERNAL_ERROR: 'An internal error occurred. Please try again',
  }
} as const;

export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true',
  ENABLE_SMTP_CHECK: process.env.ENABLE_SMTP_CHECK === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;