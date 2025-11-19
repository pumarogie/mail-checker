'use client';

import { useState } from 'react';

interface ValidationResult {
  valid: boolean;
  reason: string;
  domain?: string;
  mxRecords?: number;
}

interface BulkValidationResult {
  email: string;
  valid: boolean;
  reason: string;
  domain?: string;
  mxRecords?: number;
}

interface BulkValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  truncated: boolean;
}

interface BulkValidationResponse {
  summary: BulkValidationSummary;
  results: BulkValidationResult[];
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkValidationResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid'>('all');

  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmail = async () => {
    if (!email.trim()) {
      setResult({ valid: false, reason: 'Please enter an email address' });
      return;
    }

    if (!validateEmailFormat(email)) {
      setResult({ valid: false, reason: 'Invalid email format' });
      return;
    }

    setIsValidating(true);
    setResult(null);

    try {
      const response = await fetch('/api/v1/emails/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.error) {
        setResult({ 
          valid: false, 
          reason: data.error.message 
        });
      } else {
        setResult({
          valid: data.valid,
          reason: data.reason,
          domain: data.domain,
          mxRecords: data.checks?.mx_records
        });
      }
    } catch {
      setResult({ 
        valid: false, 
        reason: 'Network error - please try again' 
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      validateEmail();
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setBulkResults(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/emails/batch', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setBulkResults({
          summary: {
            total: data.total_count,
            valid: data.valid_count,
            invalid: data.invalid_count,
            truncated: data.metadata?.truncated || false
          },
          results: data.results.map((result: {
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
            mxRecords: result.checks?.mx_records
          }))
        });
      } else {
        setResult({ 
          valid: false, 
          reason: data.error?.message || 'File upload failed' 
        });
      }
    } catch {
      setResult({ 
        valid: false, 
        reason: 'Network error during file upload' 
      });
    } finally {
      setIsUploading(false);
    }
  };

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
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const filteredResults = bulkResults?.results.filter(result => {
    if (filter === 'valid') return result.valid;
    if (filter === 'invalid') return !result.valid;
    return true;
  }) || [];

  const downloadCSV = () => {
    if (!bulkResults) return;
    
    const csvContent = [
      'Email,Status,Reason,Domain,MX Records',
      ...bulkResults.results.map(r => 
        `"${r.email}","${r.valid ? 'Valid' : 'Invalid'}","${r.reason}","${r.domain || ''}","${r.mxRecords || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-validation-results.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          {/* Single Email Validation */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Single Email Validation</h2>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter email address..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                disabled={isValidating || isUploading}
              />
            </div>

            <button
              onClick={validateEmail}
              disabled={isValidating || isUploading || !email.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isValidating ? 'Validating...' : 'Validate Email'}
            </button>

            {result && !bulkResults && (
              <div className={`p-4 rounded-md ${
                result.valid 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    result.valid ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className={`font-medium ${
                    result.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.valid ? 'Valid Email' : 'Invalid Email'}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${
                  result.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {result.reason}
                </p>
                {result.valid && result.domain && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Domain: {result.domain} • MX Records: {result.mxRecords}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Bulk Email Validation</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 text-gray-400">
                  📁
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isUploading ? 'Processing file...' : 'Drop file here or click to browse'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Excel (.xlsx, .xls, .csv) files. PDF support coming soon.
                  </p>
                </div>
                
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  disabled={isUploading || isValidating}
                  className="hidden"
                  id="file-upload"
                />
                
                <label
                  htmlFor="file-upload"
                  className={`inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                    isUploading || isValidating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Choose File
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {bulkResults && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Validation Results</h2>
              <button
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Download CSV
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{bulkResults.summary.total}</div>
                <div className="text-sm text-blue-600">Total Emails</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{bulkResults.summary.valid}</div>
                <div className="text-sm text-green-600">Valid Emails</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{bulkResults.summary.invalid}</div>
                <div className="text-sm text-red-600">Invalid Emails</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round((bulkResults.summary.valid / bulkResults.summary.total) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All ({bulkResults.summary.total})
              </button>
              <button
                onClick={() => setFilter('valid')}
                className={`px-4 py-2 rounded-md text-sm ${
                  filter === 'valid' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Valid ({bulkResults.summary.valid})
              </button>
              <button
                onClick={() => setFilter('invalid')}
                className={`px-4 py-2 rounded-md text-sm ${
                  filter === 'invalid' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Invalid ({bulkResults.summary.invalid})
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 dark:border-gray-600 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Reason</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Domain</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">MX Records</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result, index) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 text-sm font-mono">{result.email}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          result.valid 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            result.valid ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {result.valid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{result.reason}</td>
                      <td className="px-4 py-2 text-sm">{result.domain || '-'}</td>
                      <td className="px-4 py-2 text-sm">{result.mxRecords || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bulkResults.summary.truncated && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Results were limited to 100 emails. Some emails from your file may not be shown.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This tool validates email format and checks domain MX records without sending any emails.
          </p>
        </div>
      </div>
    </div>
  );
}
