import { NextResponse } from "next/server";
import { ApiErrorResponse, EmailObject, BatchResultObject } from "@/types/api";
import { EmailValidationResult, BatchValidationResult } from "@/types/email";
import { toApiError, getErrorStatusCode } from "./errors";
import { HTTP_STATUS } from "@/lib/constants";

export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}${random}`;
};

const createBaseObject = (objectType: string) => ({
  id: generateId(objectType === "email" ? "email" : "batch"),
  created: Math.floor(Date.now() / 1000),
  livemode: process.env.NODE_ENV === "production",
});

export const toEmailObject = (result: EmailValidationResult): EmailObject => {
  return {
    object: "email",
    ...createBaseObject("email"),
    email: result.email,
    valid: result.valid,
    deliverable: result.deliverable,
    domain: result.domain_info.domain,
    reason: result.reason,
    checks: {
      format: result.checks.format,
      domain: result.checks.domain,
      mx_records: result.checks.mx_records,
      smtp: result.checks.smtp,
    },
  };
};

export const toBatchResultObject = (
  result: BatchValidationResult,
  fileName: string,
  fileSize: number,
): BatchResultObject => {
  return {
    object: "batch_result",
    ...createBaseObject("batch"),
    total_count: result.total_count,
    valid_count: result.valid_count,
    invalid_count: result.invalid_count,
    file_name: fileName,
    file_size: fileSize,
    processed_at: result.processing_stats.completed_at,
    results: result.results.map(toEmailObject),
    metadata: {
      file_type: result.file_info.type,
      processing_time_ms: result.processing_stats.processing_time_ms,
      truncated: result.processing_stats.truncated,
    },
  };
};

export const createSuccessResponse = <T>(
  data: T,
  status: number = HTTP_STATUS.OK,
): NextResponse => {
  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-API-Version": "v1",
    },
  });
};

export const createEmailSuccessResponse = (
  result: EmailValidationResult,
): NextResponse => {
  return createSuccessResponse(toEmailObject(result));
};

export const createBatchSuccessResponse = (
  result: BatchValidationResult,
  fileName: string,
  fileSize: number,
): NextResponse => {
  return createSuccessResponse(toBatchResultObject(result, fileName, fileSize));
};

export const createErrorResponse = (error: unknown): NextResponse => {
  const apiError = toApiError(error);
  const statusCode = getErrorStatusCode(error);

  const errorResponse: ApiErrorResponse = {
    error: apiError,
  };

  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-API-Version": "v1",
    },
  });
};

export const createRateLimitResponse = (
  retryAfter: number,
  limit: number,
  remaining: number = 0,
): NextResponse => {
  return NextResponse.json(
    {
      error: {
        object: "error",
        type: "rate_limit_error",
        code: "rate_limit_exceeded",
        message: "Too many requests",
      },
    },
    {
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v1",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(
          Date.now() / 1000 + retryAfter,
        ).toString(),
        "Retry-After": retryAfter.toString(),
      },
    },
  );
};

export const addCorsHeaders = (response: NextResponse): NextResponse => {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
};

export const validateContentType = (request: Request): boolean => {
  const contentType = request.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return true;
  }

  if (contentType?.includes("multipart/form-data")) {
    return true;
  }

  return false;
};

export const getClientInfo = (request: Request) => {
  return {
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    referer: request.headers.get("referer"),
    timestamp: new Date().toISOString(),
  };
};

export const generateRequestId = (): string => {
  return generateId("req");
};

export const addTracingHeaders = (
  response: NextResponse,
  requestId?: string,
): NextResponse => {
  if (requestId) {
    response.headers.set("X-Request-ID", requestId);
  }
  response.headers.set("X-Response-Time", Date.now().toString());
  return response;
};
