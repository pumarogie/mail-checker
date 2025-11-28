import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TxtFileOptions {
  emails: string[];
  prefix?: string;
}

export interface TxtFileResult {
  filePath: string;
  emailCount: number;
}

/**
 * Creates a temporary txt file with cleaned emails (one per line)
 * @param options - Configuration options including email list
 * @returns Object containing the file path and email count
 */
export async function createTempTxtFile(options: TxtFileOptions): Promise<TxtFileResult> {
  const { emails, prefix = 'emails' } = options;

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `${prefix}-${timestamp}-${randomSuffix}.txt`;

  // Get system temp directory
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, filename);

  // Normalize and deduplicate emails
  const normalizedEmails = emails.map(email => email.toLowerCase().trim());
  const uniqueEmails = [...new Set(normalizedEmails)];

  // Create file content with one email per line
  const fileContent = uniqueEmails.join('\n');

  // Write to temp file
  await fs.writeFile(filePath, fileContent, 'utf-8');

  return {
    filePath,
    emailCount: uniqueEmails.length
  };
}

/**
 * Deletes a temporary txt file
 * @param filePath - Path to the file to delete
 */
export async function deleteTempTxtFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Silently fail if file doesn't exist or can't be deleted
    console.warn(`Failed to delete temp file ${filePath}:`, error);
  }
}

/**
 * Reads emails from a txt file (one per line)
 * @param filePath - Path to the txt file
 * @returns Array of email addresses
 */
export async function readEmailsFromTxtFile(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
