import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { logError } from "@/lib/utils/errors";
import { generateRequestId, getClientInfo } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { error: { message: "File ID is required", code: "missing_file_id" } },
        { status: 400 }
      );
    }

    // Sanitize file ID to prevent directory traversal
    const sanitizedFileId = fileId.replace(/[^a-zA-Z0-9-]/g, "");

    if (sanitizedFileId !== fileId) {
      return NextResponse.json(
        { error: { message: "Invalid file ID", code: "invalid_file_id" } },
        { status: 400 }
      );
    }

    // Construct file path
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `excel-${sanitizedFileId}.xlsx`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        {
          error: {
            message: "File not found or has expired",
            code: "file_not_found",
          },
        },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Delete file after reading (one-time download)
    fs.unlink(filePath).catch((err) => {
      console.warn(`Failed to delete temp Excel file ${filePath}:`, err);
    });

    // Return Excel file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="validation-results-${sanitizedFileId}.xlsx"`,
        "Content-Length": fileBuffer.length.toString(),
        "X-Request-Id": requestId,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    logError(error, {
      requestId,
      client: getClientInfo(request),
      endpoint: "/api/v1/emails/batch/download",
    });

    return NextResponse.json(
      {
        error: {
          message: "Failed to download file",
          code: "download_failed",
        },
      },
      { status: 500 }
    );
  }
}
