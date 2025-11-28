import * as XLSX from 'xlsx';

export interface ValidationResult {
  email: string;
  status: 'Valid' | 'Invalid';
}

export interface ExcelGeneratorOptions {
  results: ValidationResult[];
  sheetName?: string;
}

/**
 * Generates an Excel file from validation results
 * @param options - Configuration options including validation results
 * @returns Buffer containing the Excel file
 */
export function generateExcelFile(options: ExcelGeneratorOptions): Buffer {
  const { results, sheetName = 'Validation Results' } = options;

  // Create worksheet data with headers
  const worksheetData = [
    ['Email', 'Status'],
    ...results.map(result => [result.email, result.status])
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 40 }, // Email column width
    { wch: 15 }  // Status column width
  ];

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file as buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true
  });

  return excelBuffer as Buffer;
}

/**
 * Generates a filename for the Excel export with timestamp
 * @returns Filename string with timestamp
 */
export function generateExcelFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `validation-results-${timestamp}.xlsx`;
}
