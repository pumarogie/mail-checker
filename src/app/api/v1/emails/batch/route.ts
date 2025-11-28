import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
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
import {
  generateExcelFile,
  type ValidationResult
} from "@/lib/services/excel-generator";
import {
  createTempTxtFile,
  deleteTempTxtFile
} from "@/lib/services/txt-generator";

const fileProcessor = new FileProcessorService();

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  let tempTxtFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ValidationError("File is required", "file");
    }

    // Process and validate the file
    const result = await fileProcessor.processAndValidateFile(file);

    // Create temporary txt file with cleaned emails
    const txtFileResult = await createTempTxtFile({
      emails: result.results.map(r => r.email),
      prefix: 'validation-emails'
    });
    tempTxtFilePath = txtFileResult.filePath;

    // Convert validation results to Excel format
    const excelData: ValidationResult[] = result.results.map(r => ({
      email: r.email,
      status: r.valid ? 'Valid' : 'Invalid'
    }));

    // Generate Excel file
    const excelBuffer = generateExcelFile({ results: excelData });

    // Generate unique file ID for download
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    // Save Excel file to temp directory
    const tempDir = os.tmpdir();
    const tempExcelPath = path.join(tempDir, `excel-${fileId}.xlsx`);
    await fs.writeFile(tempExcelPath, excelBuffer);

    // Generate download URL
    const downloadUrl = `/api/v1/emails/batch/download?id=${fileId}`;

    // Return JSON response with download URL instead of base64
    const responseData = {
      ...result,
      excel_download_url: downloadUrl,
      excel_file_id: fileId,
    };

    const response = createBatchSuccessResponse(responseData, file.name, file.size);
    return addTracingHeaders(response, requestId);
  } catch (error) {
    logError(error, {
      requestId,
      client: getClientInfo(request),
      endpoint: "/api/v1/emails/batch",
    });

    const response = createErrorResponse(error);
    return addTracingHeaders(response, requestId);
  } finally {
    // Clean up temporary txt file
    if (tempTxtFilePath) {
      await deleteTempTxtFile(tempTxtFilePath);
    }
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
