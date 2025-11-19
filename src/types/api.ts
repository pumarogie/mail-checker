import { z } from "zod";

export interface BaseApiObject {
  object: string;
  id?: string;
  created?: number;
  livemode: boolean;
}

export type ApiErrorType =
  | "api_error"
  | "invalid_request_error"
  | "validation_error"
  | "rate_limit_error";

export interface ApiError {
  object: "error";
  type: ApiErrorType;
  code?: string;
  message: string;
  param?: string;
  decline_code?: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export const EmailVerifyRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  options: z
    .object({
      check_mx: z.boolean().default(true),
      check_smtp: z.boolean().default(false),
    })
    .optional(),
});

export const BatchEmailRequestSchema = z.object({
  file: z.instanceof(File),
  options: z
    .object({
      max_emails: z.number().min(1).max(1000).default(100),
      check_mx: z.boolean().default(true),
      check_smtp: z.boolean().default(false),
    })
    .optional(),
});

export type EmailVerifyRequest = z.infer<typeof EmailVerifyRequestSchema>;
export type BatchEmailRequest = z.infer<typeof BatchEmailRequestSchema>;

export interface EmailObject extends BaseApiObject {
  object: "email";
  email: string;
  valid: boolean;
  deliverable: "deliverable" | "undeliverable" | "unknown";
  domain: string;
  reason: string;
  checks: {
    format: boolean;
    domain: boolean;
    mx_records: number;
    smtp?: boolean;
  };
}

export interface BatchResultObject extends BaseApiObject {
  object: "batch_result";
  total_count: number;
  valid_count: number;
  invalid_count: number;
  file_name: string;
  file_size: number;
  processed_at: number;
  results: EmailObject[];
  metadata: {
    file_type: string;
    processing_time_ms: number;
    truncated: boolean;
  };
}

export type EmailVerifyResponse = EmailObject | ApiErrorResponse;
export type BatchEmailResponse = BatchResultObject | ApiErrorResponse;

export interface PaginatedResponse<T> extends BaseApiObject {
  object: "list";
  data: T[];
  has_more: boolean;
  total_count?: number;
  url: string;
}

export type ValidationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface ProcessingStatus extends BaseApiObject {
  object: "processing_status";
  status: ValidationStatus;
  progress: number;
  estimated_completion?: number;
}
