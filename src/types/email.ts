export interface MXRecord {
  priority: number;
  exchange: string;
}

export interface DomainInfo {
  domain: string;
  exists: boolean;
  mx_records: MXRecord[];
  mx_count: number;
}

export interface ValidationOptions {
  check_mx: boolean;
  check_smtp: boolean;
  timeout_ms?: number;
}

export interface EmailValidationResult {
  email: string;
  valid: boolean;
  deliverable: "deliverable" | "undeliverable" | "unknown";
  domain_info: DomainInfo;
  reason: string;
  checks: {
    format: boolean;
    domain: boolean;
    mx_records: number;
    smtp?: boolean;
  };
  validation_time_ms: number;
}

export interface FileProcessingResult {
  emails: string[];
  file_info: {
    name: string;
    size: number;
    type: string;
    mime_type: string;
  };
  extraction_info: {
    total_extracted: number;
    duplicates_removed: number;
    processing_time_ms: number;
  };
}

export interface ExcelFileInfo {
  filename: string;
  data: string;
  size: number;
}

export interface BatchValidationResult {
  total_count: number;
  valid_count: number;
  invalid_count: number;
  results: EmailValidationResult[];
  file_info: FileProcessingResult["file_info"];
  processing_stats: {
    started_at: number;
    completed_at: number;
    processing_time_ms: number;
    truncated: boolean;
  };
  excel_file?: ExcelFileInfo;
}

export type SupportedFileType = "xlsx" | "xls" | "csv" | "pdf";

export interface FileTypeInfo {
  extension: string;
  mime_types: string[];
  supported: boolean;
  description: string;
}

export interface ValidationError {
  email: string;
  error_type:
    | "format_error"
    | "domain_error"
    | "mx_error"
    | "smtp_error"
    | "timeout_error";
  message: string;
  details?: Record<string, unknown>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: number;
  retry_after?: number;
}
