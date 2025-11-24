"use client";

import { useState } from "react";

interface BulkUploadZoneProps {
  onFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  disabled?: boolean;
}

export function BulkUploadZone({
  onFileUpload,
  isUploading,
  disabled = false,
}: BulkUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bulk Email Validation</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 text-gray-400">📁</div>
          <div>
            <p className="text-sm font-medium">
              {isUploading
                ? "Processing file..."
                : "Drop file here or click to browse"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports Excel (.xlsx, .xls, .csv) files up to 100 MB.
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={isUploading || disabled}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className={`inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
              isUploading || disabled
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            Choose File
          </label>
        </div>
      </div>
    </div>
  );
}
