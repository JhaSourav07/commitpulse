import type { ParsedResume, Education, Experience, Project } from '@/types/student';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.\w+/;
const NAME_LINE_REGEX = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/;
const PDF_ARTIFACT_PATTERNS = [
  /^\d+\s+\d+\s+R$/,
  /^\d+\s+0\s+R$/,
  /^endobj$/i,
  /^obj$/i,
  /^xref$/i,
  /^trailer$/i,
  /^startxref$/i,
  /^stream$/i,
  /^endstream$/i,
  /^structelem$/i,
  /^pg\s*\d+/i,
  /^\/[A-Za-z0-9]+\s*\(.*\)$/i,
  /^>>\s*endc$/i,
];
const GENERIC_SKILL_BLACKLIST = new Set([
  'experience',
  'education',
  'projects',
  'project',
  'summary',
  'objective',
  'profile',
  'skills',
  'skill',
  'languages',
  'tools',
  'technologies',
  'proficiencies',
  'certifications',
  'contact',
  'phone',
  'email',
  'address',
]);
const SECTION_HEADERS = [
  'summary',
  'profile',
  'about',
  'objective',
  'skills',
  'technical skills',
  'experience',
  'work experience',
  'employment',
  'projects',
  'certifications',
  'education',
  'contact',
];
const SINGLE_WORD_SKILL_ALLOWLIST = new Set([
  'react',
  'redux',
  'docker',
  'git',
  'graphql',
  'kubernetes',
  'figma',
  'linux',
  'java',
  'python',
  'scala',
  'rust',
  'go',
  'sql',
  'aws',
  'gcp',
  'azure',
  'html',
  'css',
  'html5',
  'css3',
  'node',
]);

const SKILL_SECTION_HEADERS = /skills|technologies|proficiencies|tech stack|tools/i;
const EDUCATION_SECTION_HEADERS = /education|academic|qualification|degree/i;
const EXPERIENCE_SECTION_HEADERS = /experience|work|employment|professional|career/i;
const execFileAsync = promisify(execFile);

function extractEmail(text: string): string {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : '';
}

function extractProjects(text: string): Project[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) => /^(projects|project)\b/i.test(line));
  if (start === -1) return [];

  const projects: Project[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^(certifications|education|experience|skills)\b/i.test(line)) break;
    const skillish = extractSkills(line);
    if (line.length >= 4) {
      projects.push({
        title: line.replace(/[:\-–].*$/, '').trim(),
        description: line,
        technologies: skillish,
      });
    }
  }
  return projects.slice(0, 5);
}

function extractCertifications(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) => /^(certifications?|licenses?)\b/i.test(line));
  if (start === -1) return [];
  const items: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^(education|experience|skills|projects)\b/i.test(line)) break;
    if (line.length >= 3) items.push(line);
  }
  return [...new Set(items)].slice(0, 10);
}

function extractName(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 20); i += 1) {
    const line = lines[i];
    const match = line.match(NAME_LINE_REGEX);
    if (
      match &&
      !line.includes('@') &&
      !line.includes('http') &&
      !GENERIC_SKILL_BLACKLIST.has(line.toLowerCase())
    ) {
      return match[1];
    }
  }
  const emailIndex = lines.findIndex((line) => EMAIL_REGEX.test(line));
  if (emailIndex > 0) {
    for (let i = emailIndex - 1; i >= 0 && i >= emailIndex - 3; i -= 1) {
      const line = lines[i];
      const match = line.match(NAME_LINE_REGEX);
      if (match && !line.includes('@') && !line.includes('http')) {
        return match[1];
      }
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
  const sourceText = section.length > 0 ? section.join(' ') : text;
  const rawSkills = sourceText
    .split(/[,•·;|/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((entry) => entry.split(/\s{2,}|(?:\s+-\s+)/))
    .map((s) => s.trim())
    .filter(Boolean);

  const skills = rawSkills
    .map((skill) =>
      skill
        .replace(/[()\[\]{}<>]/g, '')
        .replace(/\b(?:view|add|save|back|resume|profile)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((skill) => skill.length >= 2 && skill.length <= 40)
    .filter((skill) => /[A-Za-z]/.test(skill))
    .filter((skill) => !/^\d+$/.test(skill))
    .filter((skill) => !PDF_ARTIFACT_PATTERNS.some((pattern) => pattern.test(skill)))
    .filter((skill) => !GENERIC_SKILL_BLACKLIST.has(skill.toLowerCase()))
    .filter((skill) => !skill.includes('@'))
    .filter((skill) => {
      const words = skill.split(' ');
      if (words.length >= 2 && words.length <= 4) {
        const looksLikeName = words.every((word) => /^[A-Z][a-z]+$/.test(word));
        if (looksLikeName) return false;
      }
      return true;
    })
    .filter((skill) => {
      const words = skill.split(' ');
      if (words.length > 1 && words.some((word) => word.length === 1)) {
        return false;
      }
      if (words.length === 1 && !SINGLE_WORD_SKILL_ALLOWLIST.has(skill.toLowerCase())) {
        return /[A-Z][a-z]/.test(skill) || /[.#+-]/.test(skill);
      }
      if (words.length > 4) {
        return false;
      }
      if (words.length >= 3 && skill.endsWith('.')) {
        return false;
      }
      return words.every((word) => word.length > 1 || /[A-Z0-9.+#-]/.test(word));
    });

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

async function extractPdfText(buffer: Buffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'resume-pdf-'));
  const inputPath = join(dir, 'resume.pdf');
  try {
    await writeFile(inputPath, buffer);
    const { stdout } = await execFileAsync('pdftotext', [
      '-layout',
      '-nopgbrk',
      '-enc',
      'UTF-8',
      inputPath,
      '-',
    ]);
    return String(stdout || '');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  const isPdf = mimeType === 'application/pdf' && buffer.slice(0, 4).toString('latin1') === '%PDF';

  if (isPdf) {
    try {
      return await extractPdfText(buffer);
    } catch {
      // Fall back to raw buffer text if the system extractor is unavailable or the PDF is malformed.
    }
  }
  const text = buffer.toString('utf-8');
  const printable = text
    .replace(/[^\x20-\x7E\n\r]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '')
    .trim();
  return printable;
}

function normalizeText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const lower = line.toLowerCase();
      if (PDF_ARTIFACT_PATTERNS.some((pattern) => pattern.test(line))) return false;
      if (
        lower.startsWith('page ') ||
        lower.startsWith('pg ') ||
        lower.includes('object ') ||
        lower.includes('font ') ||
        lower.includes('metadata') ||
        (line.startsWith('/') && line.includes('('))
      ) {
        return false;
      }
      return true;
    })
    .join('\n');
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
  const rawText = normalizeText(await extractTextFromBuffer(buffer, mimeType));

  return {
    name: extractName(rawText),
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    skills: extractSkills(rawText),
    education: extractEducation(rawText),
    experience: extractExperience(rawText),
    projects: extractProjects(rawText),
    certifications: extractCertifications(rawText),
  };
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
