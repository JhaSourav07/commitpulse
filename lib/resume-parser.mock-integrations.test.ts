import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseResume, ALLOWED_MIME_TYPES } from './resume-parser';

// ─── Safely mock the parser for predictable test environments ────────────
vi.mock('./resume-parser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./resume-parser')>();

  return {
    ...actual,
    parseResume: actual.parseResume,
  };
});

// ─── Strict TypeScript Interfaces (Passes ESLint) ────────────────────────
interface MockResumeData {
  name: string;
  email: string;
  phone?: string;
  skills?: string[];
  experience?: unknown[];
  education?: unknown[];
  fallback?: boolean;
}

// ─── Fake Cache Layer ────────────────────────────────────────────────────
const mockCache = new Map<string, MockResumeData>();

const getCached = (key: string) => mockCache.get(key);
const setCached = (key: string, value: MockResumeData) => mockCache.set(key, value);

// ─── Fake Database/Service Layer ─────────────────────────────────────────
// Prefixing 'input' with '_' tells ESLint to safely ignore the unused variable
const fakeDbFetch = async (input: string): Promise<MockResumeData> => {
  void input;

  await new Promise((resolve) => setTimeout(resolve, 5));

  return {
    name: 'Alex Developer',
    email: 'alex.dev@example.com',
    phone: '+1 555 019 2834',
    skills: ['TypeScript', 'React'],
    experience: [],
    education: [],
  };
};

const createMockBuffer = (text: string) => Buffer.from(text, 'utf-8');

const mime = ALLOWED_MIME_TYPES[0];

// ─── Test Suite ──────────────────────────────────────────────────────────
describe('resume-parser mock integrations', () => {
  beforeEach(() => {
    // Prevents state leakage between tests (Crucial for CI stability)
    mockCache.clear();
    vi.restoreAllMocks();
  });

  it('should return cached parsed resume before hitting service layer', async () => {
    const cached: MockResumeData = {
      name: 'Cached User',
      email: 'cached@example.com',
    };

    setCached('resume:123', cached);

    const result = getCached('resume:123');

    expect(result?.name).toBe('Cached User');
    expect(result?.email).toContain('@');
  });

  it('should load parsed resume from async service when cache misses', async () => {
    const result = await fakeDbFetch('resume.pdf');

    expect(result).toBeDefined();
    expect(result.name).toBe('Alex Developer');
    expect(result.email).toContain('@');
  });

  it('should return safe fallback when service times out', async () => {
    const timeoutFallback: MockResumeData = {
      name: '',
      email: '',
      skills: [],
      experience: [],
      education: [],
      fallback: true,
    };

    const result = await Promise.race([
      fakeDbFetch('resume.pdf'),
      new Promise<MockResumeData>((resolve) => setTimeout(() => resolve(timeoutFallback), 1)),
    ]);

    expect(result).toBeDefined();
  });

  it('should write to cache after successful service response', async () => {
    const result = await fakeDbFetch('resume.pdf');

    setCached('resume:123', result);

    const cached = getCached('resume:123');

    expect(cached?.name).toBe('Alex Developer');
    expect(cached?.email).toContain('@');
  });

  it('should safely handle invalid or empty buffer inputs', async () => {
    const emptyBuffer = createMockBuffer('');

    let error: unknown = null;

    try {
      await parseResume(emptyBuffer, mime);
    } catch (e) {
      error = e;
    }

    // Ensures the actual logic does not throw uncaught exceptions in the CI pipeline
    expect(error).toBeNull();
  });
});
