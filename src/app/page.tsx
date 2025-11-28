"use client";

import { useState } from "react";
import {
  SingleEmailValidator,
  BulkUploadZone,
  ValidationSummaryCards,
  ValidationResultsTable,
  DownloadButtons,
} from "@/components";
import type { BulkValidationResponse } from "@/types/components";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkValidationResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setBulkResults(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/v1/emails/batch", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setBulkResults({
          summary: {
            total: data.total_count,
            valid: data.valid_count,
            invalid: data.invalid_count,
            truncated: data.metadata?.truncated || false,
          },
          results: data.results.map(
            (result: {
              email: string;
              valid: boolean;
              reason: string;
              domain: string;
              checks?: { mx_records: number };
            }) => ({
              email: result.email,
              valid: result.valid,
              reason: result.reason,
              domain: result.domain,
              mxRecords: result.checks?.mx_records,
            }),
          ),
          // Support both new (download URL) and old (base64) formats
          excelDownloadUrl: data.excel_download_url,
          excelFileId: data.excel_file_id,
          excelFile: data.excel_file
            ? {
                filename: data.excel_file.filename,
                data: data.excel_file.data,
                size: data.excel_file.size,
                downloadUrl: data.excel_download_url,
                fileId: data.excel_file_id,
              }
            : data.excel_download_url
              ? {
                  downloadUrl: data.excel_download_url,
                  fileId: data.excel_file_id,
                }
              : undefined,
        });
      } else {
        setErrorMessage(data.error?.message || "File upload failed");
      }
    } catch {
      setErrorMessage("Network error during file upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Email Validator</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Validate single emails or upload Excel files for bulk validation
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SingleEmailValidator disabled={isUploading} />
          <BulkUploadZone
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
          />
        </div>
        {errorMessage && !bulkResults && (
          <div className="mt-8 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
        )}
        {bulkResults && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Validation Results</h2>
              <DownloadButtons
                results={bulkResults.results}
                excelFile={bulkResults.excelFile}
                excelDownloadUrl={bulkResults.excelDownloadUrl}
              />
            </div>

            <ValidationSummaryCards summary={bulkResults.summary} />
            <ValidationResultsTable
              results={bulkResults.results}
              summary={bulkResults.summary}
              showTruncatedWarning={true}
            />
          </div>
        )}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This tool validates email format and checks domain MX records
            without sending any emails.
          </p>
        </div>
      </div>
    </div>
  );
}
