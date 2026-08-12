import type { ParsedResume, Education, Experience } from '@/types/student';
import { z } from 'zod';

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

  for (const line of lines.slice(0, 10)) {
    const cleaned = line.replace(/^(full\s+)?name\s*[:\-]\s*/i, '');
    const match = cleaned.match(NAME_LINE_REGEX);
    if (match && !cleaned.includes('@') && !cleaned.includes('http')) {
      return match[1];
    }
  }

  return '';
}

function sanitizeExtractedText(rawText: string): string {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;

      const normalized = line.toLowerCase();
      if (/^\d+\s+\d+\s+(obj|r)$/i.test(line)) return false;
      if (/^xref$/i.test(normalized)) return false;
      if (/^trailer$/i.test(normalized)) return false;
      if (/^stream$/i.test(normalized)) return false;
      if (/^endstream$/i.test(normalized)) return false;
      if (/^endobj$/i.test(normalized)) return false;
      if (/^<<.*>>$/u.test(line)) return false;
      if (/^\/([A-Za-z0-9]+)(\s+\/([A-Za-z0-9]+))*$/u.test(line)) return false;
      if (line.startsWith('/Type ') || line.startsWith('/Font ') || line.startsWith('/Filter ') || line.startsWith('/Subtype ') || line.startsWith('/Length ')) {
        return false;
      }

      return true;
    });

  return lines
    .join('\n')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
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

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    try {
      if (buffer.toString('utf-8', 0, 4) === '%PDF') {
        const pdf = await import('pdf-parse');
        const pdfParser = ((pdf as unknown as { default?: unknown }).default || pdf) as (
          dataBuffer: Buffer,
          options?: unknown
        ) => Promise<{ text: string }>;
        const data = await pdfParser(buffer);
        rawText = data.text;
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

  return sanitizeExtractedText(rawText);
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
  const rawText = await extractTextFromBuffer(buffer, mimeType);

  // Try AI-assisted parsing if configured. Fall back to rule-based parser on any failure.
  const GEMINI_API_URL = process.env.GEMINI_API_URL || '';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

  if (GEMINI_API_URL && GEMINI_API_KEY) {
    try {
      const aiResult = await aiParseResume(rawText, GEMINI_API_URL, GEMINI_API_KEY);
      if (aiResult) return aiResult;
      // otherwise fall through to rule-based parser
    } catch (err) {
      // Do not expose AI errors to callers — log and fall back.
      // eslint-disable-next-line no-console
      console.warn('AI resume parsing failed, falling back to rule-based parser:', err);
    }
  }

  // Rule-based fallback (existing behaviour)
  return {
    name: extractName(rawText),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    skills: extractSkills(rawText),
    education: extractEducation(rawText),
    experience: extractExperience(rawText),
  };
}

// Zod schema for validating AI responses before returning to callers
const EducationSchema = z.object({
  institution: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
});

const ExperienceSchema = z.object({
  company: z.string().default(''),
  role: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  description: z.string().default(''),
});

const ParsedResumeSchema = z.object({
  name: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  skills: z.array(z.string()).default([]),
  education: z.array(EducationSchema).default([]),
  experience: z.array(ExperienceSchema).default([]),
});

async function aiParseResume(text: string, apiUrl: string, apiKey: string): Promise<ParsedResume | null> {
  // Keep prompts and responses ephemeral — do not persist.
  const prompt = `Extract a JSON object with the following fields from the resume text provided: name, email, phone, skills (array), education (array of {institution, degree, field, startDate, endDate}), experience (array of {company, role, startDate, endDate, description}). Only return valid JSON. If a field is not present, return an empty string or empty array as appropriate. Resume text:\n${text}`;

  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      prompt,
      max_output_tokens: 1024,
      temperature: 0,
    }),
    // do not cache responses
    cache: 'no-store',
  });

  if (!resp.ok) {
    throw new Error(`AI service returned ${resp.status}`);
  }

  const json = await resp.json();

  function tryParseCandidate(candidate: unknown): any {
    if (typeof candidate === 'string') {
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    }

    if (typeof candidate === 'object' && candidate !== null) {
      return candidate;
    }

    return null;
  }

  const candidates = [
    json?.output,
    json?.data,
    json?.candidates?.[0]?.content,
    json?.response?.output?.[0]?.content,
    json?.response?.text,
    json?.choices?.[0]?.message?.content,
    json?.choices?.[0]?.text,
    json,
  ];

  let parsed: any = null;
  for (const candidate of candidates) {
    const result = tryParseCandidate(candidate);
    if (result !== null) {
      parsed = result;
      break;
    }
  }

  // If parsed is still a string try to JSON.parse it directly
  if (typeof parsed === 'string') {
    const nested = tryParseCandidate(parsed);
    if (nested === null) {
      throw new Error('AI returned non-JSON output');
    }
    parsed = nested;
  }

  if (!parsed) {
    throw new Error('AI returned non-JSON output');
  }

  // Validate and coerce using Zod
  const safe = ParsedResumeSchema.safeParse(parsed);
  if (!safe.success) {
    throw new Error('AI response failed schema validation');
  }

  return safe.data as ParsedResume;
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
