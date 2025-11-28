export interface ValidationResult {
  valid: boolean;
  reason: string;
  domain?: string;
  mxRecords?: number;
}

export interface BulkValidationResult {
  email: string;
  valid: boolean;
  reason: string;
  domain?: string;
  mxRecords?: number;
}

export interface BulkValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  truncated: boolean;
}

export interface ExcelFileData {
  filename?: string;
  data?: string;
  size?: number;
  downloadUrl?: string;
  fileId?: string;
}

export interface BulkValidationResponse {
  summary: BulkValidationSummary;
  results: BulkValidationResult[];
  excelFile?: ExcelFileData;
  excelDownloadUrl?: string;
  excelFileId?: string;
}
