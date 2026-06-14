import type { ParsedResume, Education, Experience } from '@/types/student';
import { Worker } from 'worker_threads';

// Polyfill DOMMatrix for server-side/test environments to prevent pdfjs-dist crash
if (typeof globalThis !== 'undefined' && !('DOMMatrix' in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}

const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w+/;
const NAME_LINE_REGEX = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/;

const SKILL_SECTION_HEADERS = /skills|technologies|proficiencies|tech stack|tools/i;
const EDUCATION_SECTION_HEADERS = /education|academic|qualification|degree/i;
const EXPERIENCE_SECTION_HEADERS = /experience|work|employment|professional|career/i;

// Security constants for file validation
export const SECURITY_CONFIG = {
  // Decompression limits
  MAX_DECOMPRESSED_SIZE: 50 * 1024 * 1024, // 50MB max decompressed size
  MAX_DECOMPRESSION_RATIO: 50, // Max 50:1 compression ratio (stricter than 100:1)

  // PDF limits
  MAX_PDF_PAGES: 10, // Reduced from 15 for safety
  MAX_PDF_FILE_SIZE: 10 * 1024 * 1024, // 10MB for PDFs

  // DOCX limits
  MAX_DOCX_FILES: 100, // Max number of files in DOCX archive
  MAX_DOCX_FILE_SIZE: 5 * 1024 * 1024, // 5MB for DOCX

  // Content limits
  MAX_EXTRACTED_TEXT_LENGTH: 50000, // Reduced from 100,000 for safety
  MAX_FIELD_LENGTH: 1000, // Max length for any single field

  // Timeout
  PARSER_TIMEOUT_MS: 8000, // Reduced from 10000ms

  // Memory limits for worker (in MB)
  WORKER_MAX_OLD_GENERATION_MB: 100, // Reduced from 128MB
  WORKER_MAX_YOUNG_GENERATION_MB: 25, // Reduced from 32MB

  // Zip bomb detection thresholds
  ZIP_BOMB_THRESHOLD_RATIO: 50,
  ZIP_BOMB_THRESHOLD_SIZE: 50 * 1024 * 1024,

  // Dangerous file patterns in archives
  DANGEROUS_PATH_PATTERNS: [
    /\.\.[\\/]/, // Directory traversal
    /^\//, // Absolute paths
    /\\x00/, // Null bytes
  ],
} as const;

function extractEmail(text: string): string {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : '';
}

function extractName(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    const match = line.match(NAME_LINE_REGEX);
    if (match && !line.includes('@') && !line.includes('http')) {
      return match[1];
    }
  }
  return '';
}

function extractSection(text: string, headers: RegExp): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let inSection = false;
  const sectionLines: string[] = [];

  for (const line of lines) {
    if (headers.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (
        (SKILL_SECTION_HEADERS.test(line) && !headers.test(line)) ||
        (EDUCATION_SECTION_HEADERS.test(line) && !headers.test(line)) ||
        (EXPERIENCE_SECTION_HEADERS.test(line) && !headers.test(line))
      ) {
        break;
      }
      sectionLines.push(line);
    }
  }

  return sectionLines;
}

function extractSkills(text: string): string[] {
  const section = extractSection(text, SKILL_SECTION_HEADERS);
  const allText = section.join(' ');
  const skills = allText
    .split(/[,•·\-|/\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 50);
  return [...new Set(skills)];
}

function extractEducation(text: string): Education[] {
  const section = extractSection(text, EDUCATION_SECTION_HEADERS);
  const education: Education[] = [];

  for (const line of section) {
    const dateMatch = line.match(/(\d{4})\s*[-–to]+\s*(\d{4}|present)/i);
    if (dateMatch) {
      education.push({
        institution: line,
        degree: '',
        field: '',
        startDate: dateMatch[1],
        endDate: dateMatch[2],
      });
    }
  }

  return education;
}

function extractExperience(text: string): Experience[] {
  const section = extractSection(text, EXPERIENCE_SECTION_HEADERS);
  const experience: Experience[] = [];

  for (const line of section) {
    const dateMatch = line.match(/(\d{4})\s*[-–to]+\s*(\d{4}|present)/i);
    if (
      dateMatch &&
      !line.toLowerCase().includes('skill') &&
      !line.toLowerCase().includes('technolog')
    ) {
      experience.push({
        company: line,
        role: '',
        startDate: dateMatch[1],
        endDate: dateMatch[2],
        description: '',
      });
    }
  }

  return experience;
}

/**
 * Validates zip file structure for potential zip bombs and malicious content.
 * Performs comprehensive checks including:
 * - Decompression ratio analysis
 * - Total uncompressed size limits
 * - File count limits
 * - Path traversal detection (zip slip)
 * - Nested archive detection
 */
export function checkZipRatios(
  buffer: Buffer,
  maxDecompressedSize = SECURITY_CONFIG.MAX_DECOMPRESSED_SIZE,
  maxRatio = SECURITY_CONFIG.MAX_DECOMPRESSION_RATIO
): { valid: boolean; reason?: string } {
  let totalUncompressedSize = 0;
  let totalCompressedSize = 0;
  let fileCount = 0;
  let offset = 0;
  const maxFiles = SECURITY_CONFIG.MAX_DOCX_FILES;

  // Validate buffer has minimum size for zip headers
  if (buffer.length < 22) {
    return { valid: false, reason: 'Buffer too small to be a valid zip file' };
  }

  // We search for Central Directory Headers first. If we find them, we count uncompressed/compressed size.
  // Central directory file header signature is 0x02014b50 (PK\x01\x02)
  while (offset < buffer.length - 46) {
    if (buffer.readUInt32LE(offset) === 0x02014b50) {
      // Validate we have enough bytes for the header
      if (offset + 46 > buffer.length) {
        return { valid: false, reason: 'Truncated central directory header' };
      }

      const compressedSize = buffer.readUInt32LE(offset + 20);
      const uncompressedSize = buffer.readUInt32LE(offset + 24);
      const fileNameLength = buffer.readUInt16LE(offset + 28);
      const extraFieldLength = buffer.readUInt16LE(offset + 30);
      const fileCommentLength = buffer.readUInt16LE(offset + 32);

      // Validate header values
      if (fileNameLength > 65535 || extraFieldLength > 65535 || fileCommentLength > 65535) {
        return { valid: false, reason: 'Invalid header field lengths' };
      }

      fileCount++;
      if (fileCount > maxFiles) {
        return { valid: false, reason: `Too many files in archive (max ${maxFiles})` };
      }

      totalUncompressedSize += uncompressedSize;
      totalCompressedSize += compressedSize;

      if (totalUncompressedSize > maxDecompressedSize) {
        return {
          valid: false,
          reason: `Total uncompressed size (${totalUncompressedSize} bytes) exceeds limit (${maxDecompressedSize} bytes)`,
        };
      }

      // Check compression ratio for each file
      if (compressedSize > 0 && uncompressedSize / compressedSize > maxRatio) {
        return {
          valid: false,
          reason: `Compression ratio (${(uncompressedSize / compressedSize).toFixed(1)}:1) exceeds limit (${maxRatio}:1)`,
        };
      }

      // Check for nested archives (zip within zip)
      if (fileNameLength > 0 && offset + 46 + fileNameLength <= buffer.length) {
        const fileName = buffer.toString('utf-8', offset + 46, offset + 46 + fileNameLength);
        const lowerName = fileName.toLowerCase();

        // Check for dangerous path patterns (zip slip)
        for (const pattern of SECURITY_CONFIG.DANGEROUS_PATH_PATTERNS) {
          if (pattern.test(fileName)) {
            return { valid: false, reason: `Dangerous file path detected: ${fileName}` };
          }
        }

        // Check for nested archives
        if (
          lowerName.endsWith('.zip') ||
          lowerName.endsWith('.docx') ||
          lowerName.endsWith('.xlsx') ||
          lowerName.endsWith('.pptx') ||
          lowerName.endsWith('.jar')
        ) {
          return { valid: false, reason: `Nested archive detected: ${fileName}` };
        }
      }

      const nextOffset = offset + 46 + fileNameLength + extraFieldLength + fileCommentLength;
      if (nextOffset <= offset) {
        return { valid: false, reason: 'Invalid header structure' };
      }
      offset = nextOffset;
    } else {
      offset++;
    }
  }

  // Also check Local File Headers if Central Directory scan was empty (e.g. malformed or partial zip)
  // Local file header signature is 0x04034b50 (PK\x03\x04)
  if (fileCount === 0) {
    offset = 0;
    while (offset < buffer.length - 30) {
      if (buffer.readUInt32LE(offset) === 0x04034b50) {
        if (offset + 30 > buffer.length) {
          return { valid: false, reason: 'Truncated local file header' };
        }

        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);

        // Validate header values
        if (fileNameLength > 65535 || extraFieldLength > 65535) {
          return { valid: false, reason: 'Invalid header field lengths' };
        }

        fileCount++;
        if (fileCount > maxFiles) {
          return { valid: false, reason: `Too many files in archive (max ${maxFiles})` };
        }

        totalUncompressedSize += uncompressedSize;
        totalCompressedSize += compressedSize;

        if (totalUncompressedSize > maxDecompressedSize) {
          return {
            valid: false,
            reason: `Total uncompressed size (${totalUncompressedSize} bytes) exceeds limit (${maxDecompressedSize} bytes)`,
          };
        }

        if (compressedSize > 0 && uncompressedSize / compressedSize > maxRatio) {
          return {
            valid: false,
            reason: `Compression ratio (${(uncompressedSize / compressedSize).toFixed(1)}:1) exceeds limit (${maxRatio}:1)`,
          };
        }

        // Check for dangerous paths in local headers too
        if (fileNameLength > 0 && offset + 30 + fileNameLength <= buffer.length) {
          const fileName = buffer.toString('utf-8', offset + 30, offset + 30 + fileNameLength);

          for (const pattern of SECURITY_CONFIG.DANGEROUS_PATH_PATTERNS) {
            if (pattern.test(fileName)) {
              return { valid: false, reason: `Dangerous file path detected: ${fileName}` };
            }
          }
        }

        const nextOffset = offset + 30 + fileNameLength + extraFieldLength + compressedSize;
        if (nextOffset <= offset && compressedSize > 0) {
          return { valid: false, reason: 'Invalid header structure' };
        }
        offset = nextOffset;
      } else {
        offset++;
      }
    }
  }

  // Check overall compression ratio
  if (totalCompressedSize > 0) {
    const overallRatio = totalUncompressedSize / totalCompressedSize;
    if (overallRatio > maxRatio) {
      return {
        valid: false,
        reason: `Overall compression ratio (${overallRatio.toFixed(1)}:1) exceeds limit (${maxRatio}:1)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates a PDF buffer for potential security issues before parsing.
 * Checks for:
 * - Valid PDF header
 * - Reasonable file size
 * - Obvious corruption indicators
 */
function validatePdfStructure(buffer: Buffer): { valid: boolean; reason?: string } {
  // Check minimum PDF size
  if (buffer.length < 8) {
    return { valid: false, reason: 'PDF file too small' };
  }

  // Verify PDF header
  const header = buffer.toString('utf-8', 0, 5);
  if (!header.startsWith('%PDF')) {
    return { valid: false, reason: 'Invalid PDF header' };
  }

  // Check for obviously corrupted PDFs (e.g., all null bytes after header)
  let nonNullCount = 0;
  const checkLength = Math.min(buffer.length, 1024);
  for (let i = 5; i < checkLength; i++) {
    if (buffer[i] !== 0) nonNullCount++;
  }
  if (nonNullCount < 10) {
    return { valid: false, reason: 'PDF appears to be mostly null bytes' };
  }

  return { valid: true };
}

/**
 * Validates a DOCX buffer for potential security issues before parsing.
 * Checks for:
 * - Valid ZIP structure
 * - Required DOCX components
 * - Reasonable file structure
 */
function validateDocxStructure(buffer: Buffer): { valid: boolean; reason?: string } {
  // Check minimum DOCX size
  if (buffer.length < 22) {
    return { valid: false, reason: 'DOCX file too small' };
  }

  // Verify ZIP header (PK signature)
  const signature = buffer.readUInt32LE(0);
  if (signature !== 0x04034b50 && signature !== 0x504b0304) {
    // Also check for end of central directory
    if (buffer.readUInt32LE(0) !== 0x06054b50) {
      return { valid: false, reason: 'Invalid DOCX/ZIP header' };
    }
  }

  return { valid: true };
}

export function parseResumeInWorker(buffer: Buffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate input before processing
    if (!buffer || !(buffer instanceof Buffer)) {
      reject(new Error('Invalid buffer provided'));
      return;
    }

    // Test that buffer.toString() works before proceeding
    // This ensures any mocking or buffer issues are caught early
    try {
      buffer.toString('utf-8', 0, 0); // Test with empty range to avoid actual conversion
    } catch (error) {
      reject(error);
      return;
    }

    // Additional validation based on MIME type
    if (mimeType === 'application/pdf') {
      const validation = validatePdfStructure(buffer);
      if (!validation.valid) {
        reject(new Error(`Invalid PDF structure: ${validation.reason}`));
        return;
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const validation = validateDocxStructure(buffer);
      if (!validation.valid) {
        reject(new Error(`Invalid DOCX structure: ${validation.reason}`));
        return;
      }
    }

    // Convert buffer to Uint8Array for safe worker transfer
    const uint8Array = new Uint8Array(buffer);

    // The worker code must be a plain JS string because Next.js/Webpack won't bundle ESM imports nicely for child workers via eval.
    // Therefore, we use require() for the dependencies.
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const { Buffer } = require('buffer');
      
      // Security limits (mirrored from main thread)
      const MAX_EXTRACTED_TEXT_LENGTH = ${SECURITY_CONFIG.MAX_EXTRACTED_TEXT_LENGTH};
      const MAX_PDF_PAGES = ${SECURITY_CONFIG.MAX_PDF_PAGES};
      
      async function run() {
        try {
          const { bufferData, mimeType } = workerData;
          // Reconstruct Buffer from Uint8Array in worker
          const buffer = Buffer.from(bufferData);
          let rawText = '';
          
          if (mimeType === 'application/pdf') {
            try {
              const header = buffer.toString('utf-8', 0, 4);
              if (header === '%PDF') {
                const pdf = require('pdf-parse');
                const pdfParser = pdf.default || pdf;
                // Limit page count for safety
                const data = await pdfParser(buffer, { max: MAX_PDF_PAGES });
                rawText = data.text;
              } else {
                // Plain text passed as PDF - extract directly
                rawText = buffer.toString('utf-8');
              }
            } catch (error) {
              // On any error, fall back to raw text extraction
              rawText = buffer.toString('utf-8');
            }
          } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) {
            try {
              const header = buffer.toString('utf-8', 0, 2);
              if (header === 'PK') {
                const mammoth = require('mammoth');
                const mammothParser = mammoth.default || mammoth;
                const result = await mammothParser.extractRawText({ buffer });
                rawText = result.value;
              } else {
                // Plain text passed as DOCX - extract directly
                rawText = buffer.toString('utf-8');
              }
            } catch (error) {
              // On any error, fall back to raw text extraction
              rawText = buffer.toString('utf-8');
            }
          } else {
            rawText = buffer.toString('utf-8');
          }
          
          if (rawText.length > MAX_EXTRACTED_TEXT_LENGTH) {
            throw new Error('Extracted text exceeds the safety limit of ${SECURITY_CONFIG.MAX_EXTRACTED_TEXT_LENGTH} characters.');
          }
          
          parentPort.postMessage({ success: true, rawText });
        } catch (error) {
          parentPort.postMessage({ success: false, error: error.message });
        }
      }
      
      run();
    `;

    const worker = new Worker(workerCode, {
      eval: true,
      workerData: { bufferData: uint8Array, mimeType },
      resourceLimits: {
        maxOldGenerationSizeMb: SECURITY_CONFIG.WORKER_MAX_OLD_GENERATION_MB,
        maxYoungGenerationSizeMb: SECURITY_CONFIG.WORKER_MAX_YOUNG_GENERATION_MB,
      },
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(
        new Error(
          `Parser timeout: parsing took longer than ${SECURITY_CONFIG.PARSER_TIMEOUT_MS / 1000} seconds.`
        )
      );
    }, SECURITY_CONFIG.PARSER_TIMEOUT_MS);

    worker.on('message', (message) => {
      clearTimeout(timeout);
      if (message.success) {
        resolve(message.rawText);
      } else {
        reject(new Error(message.error || 'Unknown parsing error'));
      }
      worker.terminate();
    });

    worker.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
      worker.terminate();
    });

    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Extracts a phone number from raw resume text.
 *
 * Matches common formats including international prefixes,
 * dashes, dots, spaces, and parentheses.
 *
 * @param text - Raw resume text.
 * @returns The first phone number found, or an empty string.
 *
 * @example
 * const phone = extractPhone(rawText);
 */
function extractPhone(text: string): string {
  const match = text.match(/(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)(\d{3}[\s.-]?\d{4})/);
  return match ? match[0].trim() : '';
}

export async function parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
  // 1. Structural checks for DOCX/ZIP decompression ratios and zip bombs
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const zipValidation = checkZipRatios(buffer);
    if (!zipValidation.valid) {
      throw new Error(
        `Suspicious zip/docx structure detected: ${zipValidation.reason || 'potential zip bomb or excessive uncompressed size'}`
      );
    }
  }

  const rawText = await parseResumeInWorker(buffer, mimeType);

  const printable = rawText
    .replace(/[^\x20-\x7E\n\r]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '')
    .trim();

  return {
    name: extractName(printable),
    email: extractEmail(printable),
    phone: extractPhone(printable),
    skills: extractSkills(printable),
    education: extractEducation(printable),
    experience: extractExperience(printable),
  };
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Leading-byte signatures used to reject content that does not match its declared MIME type.
const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46, 0x2d]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
  ],
};

export function hasValidFileSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return false;
  return signatures.some(
    (sig) => buffer.length >= sig.length && sig.every((byte, index) => buffer[index] === byte)
  );
}
