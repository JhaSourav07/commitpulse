import 'server-only';
import type { ParsedResume, Education, Experience } from '@/types/student';

// Polyfill DOMMatrix for server-side/test environments to prevent pdfjs-dist crash
if (typeof globalThis !== 'undefined' && !('DOMMatrix' in globalThis)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}

const EMAIL_REGEX = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/i;
const NAME_LINE_REGEX = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/;

const SKILL_SECTION_HEADERS = /skills|technologies|proficiencies|tech stack|tools/i;
const EDUCATION_SECTION_HEADERS = /education|academic|qualification|degree/i;
const EXPERIENCE_SECTION_HEADERS = /experience|work|employment|professional|career/i;

function extractEmail(text: string): string {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : 'N/A';
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
  return 'N/A';
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

function isValidSkill(skill: string): boolean {
  const cleaned = skill.trim();

  const shortSkills = new Set(['C', 'R', 'Go', 'AI', 'ML', 'JS', 'TS', 'C++', 'C#', '.NET']);

  if (shortSkills.has(cleaned)) {
    return true;
  }

  return (
    cleaned.length >= 2 &&
    cleaned.length < 50 &&
    /^[a-zA-Z0-9.+#\s-]+$/.test(cleaned) &&
    !/[?~<>]/.test(cleaned) &&
    !/^[A-Za-z]\s+[A-Za-z]$/.test(cleaned)
  );
}

function extractSkills(text: string): string[] {
  const section = extractSection(text, SKILL_SECTION_HEADERS);
  const skills = section
    .flatMap((line) => line.split(/[,•·|/]+/))
    .map((s) => s.trim())
    .filter(isValidSkill);
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

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    try {
      if (buffer.toString('utf-8', 0, 4) === '%PDF') {
        const { PDFParse } = await import('pdf-parse');

        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();

        rawText = result.text;
      } else {
        rawText = buffer.toString('utf-8');
      }
    } catch (error) {
      console.warn('Failed to parse PDF using pdf-parse, falling back to UTF-8 decoding:', error);
      rawText = buffer.toString('utf-8');
    }
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      if (buffer.toString('utf-8', 0, 2) === 'PK') {
        const mammothModule = await import('mammoth');
        const mammothParser = ((mammothModule as unknown as { default?: unknown }).default ||
          mammothModule) as typeof mammothModule;
        const result = await mammothParser.extractRawText({ buffer });
        rawText = result.value;
      } else {
        rawText = buffer.toString('utf-8');
      }
    } catch (error) {
      console.warn('Failed to parse DOCX using mammoth, falling back to UTF-8 decoding:', error);
      rawText = buffer.toString('utf-8');
    }
  } else {
    rawText = buffer.toString('utf-8');
  }

  const printable = rawText
    .replace(/[^\x20-\x7E\n\r]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '')
    .trim();
  return printable;
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
  const match = text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{3,9}/);
  return match ? match[0].trim() : 'N/A';
}

export async function parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
  if (!buffer) {
    throw new TypeError('Buffer cannot be null or undefined');
  }
  const rawText = await extractTextFromBuffer(buffer, mimeType);

  const name = extractName(rawText);
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const skills = extractSkills(rawText);
  const education = extractEducation(rawText);
  const experience = extractExperience(rawText);

  return {
    name: name && name.trim() ? name.trim() : 'N/A',
    email: email && email.trim() ? email.trim() : 'N/A',
    phone: phone && phone.trim() ? phone.trim() : 'N/A',
    skills: Array.isArray(skills) ? skills.filter(Boolean) : [],
    education: Array.isArray(education)
      ? education.map((edu) => ({
          institution: edu.institution?.trim() || 'N/A',
          degree: edu.degree?.trim() || 'N/A',
          field: edu.field?.trim() || 'N/A',
          startDate: edu.startDate?.trim() || 'N/A',
          endDate: edu.endDate?.trim() || 'N/A',
        }))
      : [],
    experience: Array.isArray(experience)
      ? experience.map((exp) => ({
          company: exp.company?.trim() || 'N/A',
          role: exp.role?.trim() || 'N/A',
          startDate: exp.startDate?.trim() || 'N/A',
          endDate: exp.endDate?.trim() || 'N/A',
          description: exp.description?.trim() || 'N/A',
        }))
      : [],
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
