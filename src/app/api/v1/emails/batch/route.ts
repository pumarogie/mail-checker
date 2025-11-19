import { NextRequest, NextResponse } from "next/server";
import { FileProcessorService } from "@/lib/services/file-processor";
import {
  createBatchSuccessResponse,
  createErrorResponse,
  generateRequestId,
  addTracingHeaders,
  getClientInfo,
} from "@/lib/utils/response";
import { logError, ValidationError } from "@/lib/utils/errors";
import { FILE_LIMITS } from "@/lib/constants";

const fileProcessor = new FileProcessorService();

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ValidationError("File is required", "file");
    }

    const result = await fileProcessor.processAndValidateFile(file);

    const response = createBatchSuccessResponse(result, file.name, file.size);
    return addTracingHeaders(response, requestId);
  } catch (error) {
    logError(error, {
      requestId,
      client: getClientInfo(request),
      endpoint: "/api/v1/emails/batch",
    });

    const response = createErrorResponse(error);
    return addTracingHeaders(response, requestId);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET() {
  const requestId = generateRequestId();

  try {
    const info = {
      object: "batch_info",
      supported_formats: FILE_LIMITS.SUPPORTED_FORMATS,
      limits: {
        max_file_size_mb: FILE_LIMITS.MAX_FILE_SIZE_MB,
        max_emails_per_batch: FILE_LIMITS.MAX_EMAILS_FREE_TIER,
      },
      mime_types: FILE_LIMITS.MIME_TYPES,
    };

    const response = NextResponse.json(info, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-API-Version": "v1",
      },
    });

    return addTracingHeaders(response, requestId);
  } catch (error) {
    const response = createErrorResponse(error);
    return addTracingHeaders(response, requestId);
  }
}
