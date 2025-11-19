import { ZodError } from "zod";
import { ApiError, ApiErrorType } from "@/types/api";
import { ERROR_CODES, HTTP_STATUS } from "@/lib/constants";

export class AppError extends Error {
  public readonly type: ApiErrorType;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly param?: string;

  constructor(
    type: ApiErrorType,
    code: string,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    param?: string,
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.param = param;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, param?: string) {
    super(
      "validation_error",
      ERROR_CODES.INVALID_EMAIL_FORMAT,
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      param,
    );
    this.name = "ValidationError";
  }
}

export class FileProcessingError extends AppError {
  constructor(code: string, message: string, param?: string) {
    super(
      "invalid_request_error",
      code,
      message,
      HTTP_STATUS.BAD_REQUEST,
      param,
    );
    this.name = "FileProcessingError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(
      "rate_limit_error",
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
    );
    this.name = "RateLimitError";
  }
}

export class DomainError extends AppError {
  constructor(_domain: string, message: string) {
    super(
      "validation_error",
      ERROR_CODES.DOMAIN_NOT_FOUND,
      message,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      "domain",
    );
    this.name = "DomainError";
  }
}

export const createValidationError = (
  message: string,
  param?: string,
): ValidationError => {
  return new ValidationError(message, param);
};

export const createFileError = (
  type: "size" | "format" | "extraction" | "empty",
  details?: string,
): FileProcessingError => {
  switch (type) {
    case "size":
      return new FileProcessingError(
        ERROR_CODES.FILE_TOO_LARGE,
        "File size exceeds the maximum allowed limit",
        "file",
      );
    case "format":
      return new FileProcessingError(
        ERROR_CODES.UNSUPPORTED_FORMAT,
        `Unsupported file format. ${details || "Please use Excel (.xlsx, .xls, .csv) files."}`,
        "file",
      );
    case "extraction":
      return new FileProcessingError(
        ERROR_CODES.EXTRACTION_FAILED,
        `Failed to extract emails from file. ${details || ""}`.trim(),
        "file",
      );
    case "empty":
      return new FileProcessingError(
        ERROR_CODES.NO_EMAILS_FOUND,
        "No email addresses found in the uploaded file",
        "file",
      );
    default:
      return new FileProcessingError(
        ERROR_CODES.INTERNAL_ERROR,
        "Unknown file processing error",
        "file",
      );
  }
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof AppError) {
    return {
      object: "error",
      type: error.type,
      code: error.code,
      message: error.message,
      param: error.param,
    };
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return {
      object: "error",
      type: "invalid_request_error",
      code: "invalid_parameters",
      message: firstIssue.message,
      param: firstIssue.path.join("."),
    };
  }

  if (error instanceof Error) {
    const isProduction = process.env.NODE_ENV === "production";
    return {
      object: "error",
      type: "api_error",
      code: ERROR_CODES.INTERNAL_ERROR,
      message: isProduction ? "An internal error occurred" : error.message,
    };
  }

  return {
    object: "error",
    type: "api_error",
    code: ERROR_CODES.INTERNAL_ERROR,
    message: "An unknown error occurred",
  };
};

export const getErrorStatusCode = (error: unknown): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (error instanceof ZodError) {
    return HTTP_STATUS.BAD_REQUEST;
  }

  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
};

export const logError = (
  error: unknown,
  context?: Record<string, unknown>,
): void => {
  const errorInfo = {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof AppError ? error.type : "unknown",
    code: error instanceof AppError ? error.code : undefined,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error("API Error:", JSON.stringify(errorInfo, null, 2));
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof AppError) {
    return error.type === "api_error" && error.statusCode >= 500;
  }
  return false;
};

export const isClientError = (error: unknown): boolean => {
  if (error instanceof AppError) {
    return error.statusCode >= 400 && error.statusCode < 500;
  }
  return false;
};
