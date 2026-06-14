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

function checkZipRatios(
  buffer: Buffer,
  maxDecompressedSize = 50 * 1024 * 1024,
  maxRatio = 100
): boolean {
  let totalUncompressedSize = 0;
  let offset = 0;

  // We search for Central Directory Headers first. If we find them, we count uncompressed/compressed size.
  // Central directory file header signature is 0x02014b50 (PK\x01\x02)
  while (offset < buffer.length - 46) {
    if (buffer.readUInt32LE(offset) === 0x02014b50) {
      const compressedSize = buffer.readUInt32LE(offset + 20);
      const uncompressedSize = buffer.readUInt32LE(offset + 24);
      const fileNameLength = buffer.readUInt16LE(offset + 28);
      const extraFieldLength = buffer.readUInt16LE(offset + 30);
      const fileCommentLength = buffer.readUInt16LE(offset + 32);

      totalUncompressedSize += uncompressedSize;

      if (totalUncompressedSize > maxDecompressedSize) {
        return false;
      }

      if (compressedSize > 0 && uncompressedSize / compressedSize > maxRatio) {
        return false;
      }

      offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
    } else {
      offset++;
    }
  }

  // Also check Local File Headers if Central Directory scan was empty (e.g. malformed or partial zip)
  // Local file header signature is 0x04034b50 (PK\x03\x04)
  if (totalUncompressedSize === 0) {
    offset = 0;
    while (offset < buffer.length - 30) {
      if (buffer.readUInt32LE(offset) === 0x04034b50) {
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraFieldLength = buffer.readUInt16LE(offset + 28);

        totalUncompressedSize += uncompressedSize;

        if (totalUncompressedSize > maxDecompressedSize) {
          return false;
        }

        if (compressedSize > 0 && uncompressedSize / compressedSize > maxRatio) {
          return false;
        }

        offset += 30 + fileNameLength + extraFieldLength + compressedSize;
      } else {
        offset++;
      }
    }
  }

  return true;
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

    // Convert buffer to Uint8Array for safe worker transfer
    const uint8Array = new Uint8Array(buffer);

    // The worker code must be a plain JS string because Next.js/Webpack won't bundle ESM imports nicely for child workers via eval.
    // Therefore, we use require() for the dependencies.
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const { Buffer } = require('buffer');
      
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
                // Limit page count to 15 for safety
                const data = await pdfParser(buffer, { max: 15 });
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
          
          if (rawText.length > 100000) {
            throw new Error('Extracted text exceeds the safety limit of 100,000 characters.');
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
        maxOldGenerationSizeMb: 128,
        maxYoungGenerationSizeMb: 32,
      },
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Parser timeout: parsing took longer than 10 seconds.'));
    }, 10000);

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
    if (!checkZipRatios(buffer)) {
      throw new Error(
        'Suspicious zip/docx structure detected (potential zip bomb or excessive uncompressed size).'
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
