import type { BulkValidationResult, ExcelFileData } from "@/types/components";

interface DownloadButtonsProps {
  results: BulkValidationResult[];
  excelFile?: ExcelFileData;
  excelDownloadUrl?: string;
}

export function DownloadButtons({ results, excelFile, excelDownloadUrl }: DownloadButtonsProps) {
  const downloadCSV = () => {
    const csvContent = [
      "Email,Status,Reason,Domain,MX Records",
      ...results.map(
        (r) =>
          `"${r.email}","${r.valid ? "Valid" : "Invalid"}","${r.reason}","${r.domain || ""}","${r.mxRecords || ""}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-validation-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    // New approach: Download from URL
    if (excelDownloadUrl || excelFile?.downloadUrl) {
      const url = excelDownloadUrl || excelFile?.downloadUrl;
      if (!url) return;

      try {
        // Fetch the Excel file from the download endpoint
        const response = await fetch(url);
        if (!response.ok) {
          console.error("Failed to download Excel file");
          return;
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `validation-results-${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Error downloading Excel file:", error);
      }
      return;
    }

    // Old approach (backward compatibility): Decode base64
    if (excelFile?.data) {
      const binaryString = atob(excelFile.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = excelFile.filename || "validation-results.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={downloadExcel}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
      >
        Download Excel
      </button>
      <button
        onClick={downloadCSV}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
      >
        Download CSV
      </button>
    </div>
  );
}
