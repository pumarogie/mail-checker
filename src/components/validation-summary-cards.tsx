import type { BulkValidationSummary } from "@/types/components";

interface ValidationSummaryCardsProps {
  summary: BulkValidationSummary;
}

export function ValidationSummaryCards({ summary }: ValidationSummaryCardsProps) {
  const successRate = Math.round((summary.valid / summary.total) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">
          {summary.total}
        </div>
        <div className="text-sm text-blue-600">Total Emails</div>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">
          {summary.valid}
        </div>
        <div className="text-sm text-green-600">Valid Emails</div>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <div className="text-2xl font-bold text-red-600">
          {summary.invalid}
        </div>
        <div className="text-sm text-red-600">Invalid Emails</div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="text-2xl font-bold text-gray-600">
          {successRate}%
        </div>
        <div className="text-sm text-gray-600">Success Rate</div>
      </div>
    </div>
  );
}
