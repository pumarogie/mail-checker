import type { ValidationResult } from "@/types/components";

interface ValidationResultCardProps {
  result: ValidationResult;
}

export function ValidationResultCard({ result }: ValidationResultCardProps) {
  return (
    <div
      className={`p-4 rounded-md ${
        result.valid
          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-3 ${
            result.valid ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span
          className={`font-medium ${
            result.valid
              ? "text-green-800 dark:text-green-200"
              : "text-red-800 dark:text-red-200"
          }`}
        >
          {result.valid ? "Valid Email" : "Invalid Email"}
        </span>
      </div>
      <p
        className={`mt-2 text-sm ${
          result.valid
            ? "text-green-700 dark:text-green-300"
            : "text-red-700 dark:text-red-300"
        }`}
      >
        {result.reason}
      </p>
      {result.valid && result.domain && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          Domain: {result.domain} • MX Records: {result.mxRecords}
        </p>
      )}
    </div>
  );
}
