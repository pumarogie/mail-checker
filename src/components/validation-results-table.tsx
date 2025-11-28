"use client";

import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { BulkValidationResult, BulkValidationSummary } from "@/types/components";

interface ValidationResultsTableProps {
  results: BulkValidationResult[];
  summary: BulkValidationSummary;
  showTruncatedWarning?: boolean;
}

export function ValidationResultsTable({
  results,
  summary,
  showTruncatedWarning = false,
}: ValidationResultsTableProps) {
  const [filter, setFilter] = useState<"all" | "valid" | "invalid">("all");

  const filteredResults = results.filter((result) => {
    if (filter === "valid") return result.valid;
    if (filter === "invalid") return !result.valid;
    return true;
  });

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below visible area
  });

  return (
    <>
      {/* Filter */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-md text-sm ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          All ({summary.total})
        </button>
        <button
          onClick={() => setFilter("valid")}
          className={`px-4 py-2 rounded-md text-sm ${
            filter === "valid"
              ? "bg-green-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          Valid ({summary.valid})
        </button>
        <button
          onClick={() => setFilter("invalid")}
          className={`px-4 py-2 rounded-md text-sm ${
            filter === "invalid"
              ? "bg-red-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          }`}
        >
          Invalid ({summary.invalid})
        </button>
      </div>

      {/* Results Counter */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredResults.length.toLocaleString()} results
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg"
      >
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {/* Table Header - Fixed */}
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium w-2/5">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium w-1/6">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium w-1/4">
                  Reason
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium w-1/12">
                  Domain
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium w-1/12">
                  MX Records
                </th>
              </tr>
            </thead>
          </table>

          {/* Virtual Rows */}
          <table className="w-full">
            <tbody>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const result = filteredResults[virtualRow.index];
                return (
                  <tr
                    key={virtualRow.index}
                    className="border-t border-gray-200 dark:border-gray-700"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start + 48}px)`, // +48 for header height
                    }}
                  >
                    <td className="px-4 py-2 text-sm font-mono w-2/5">
                      {result.email}
                    </td>
                    <td className="px-4 py-2 text-sm w-1/6">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          result.valid
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                            : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-1 ${
                            result.valid ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {result.valid ? "Valid" : "Invalid"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm w-1/4">{result.reason}</td>
                    <td className="px-4 py-2 text-sm w-1/12">
                      {result.domain || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm w-1/12">
                      {result.mxRecords || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showTruncatedWarning && summary.truncated && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Results were limited to 100,000 emails. Some emails from your
            file may not be shown.
          </p>
        </div>
      )}
    </>
  );
}
