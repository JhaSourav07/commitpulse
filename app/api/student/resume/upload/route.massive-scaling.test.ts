/**
 * Massive Data Sets and Extreme High Bounds Scaling — Variation 2
 *
 * These tests exercise the upload route under high-volume, high-metric conditions:
 * enormous file buffers up to the size limit, large numbers of concurrent requests,
 * pathological filenames, and payload boundary extremes. The goal is to verify that
 * the route does not stall, corrupt output, or collapse under load — it must respond
 * correctly and within a reasonable execution window.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as resumeParser from '@/lib/resume-parser';
import type { ParsedResume } from '@/types/student';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    check = vi.fn().mockResolvedValue(true);
  }
  return { RateLimiter: MockRateLimiter };
});

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/resume-parser', () => ({
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  hasValidFileSignature: vi.fn().mockReturnValue(true),
  parseResume: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Shared mock return value — fully satisfies ParsedResume
// ---------------------------------------------------------------------------

const MASSIVE_PARSED_RESUME: ParsedResume = {
  name: 'Massive Contributor',
  email: 'massive@example.com',
  phone: '',
  skills: Array.from({ length: 500 }, (_, i) => `Skill_${i}`),
  education: [],
  experience: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTypedArray(bytes: number[]): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(bytes.length));
  bytes.forEach((b, i) => {
    buf[i] = b;
  });
  return buf;
}

const PDF_MAGIC = makeTypedArray([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const DOCX_MAGIC = makeTypedArray([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04

function buildBuffer(magic: Uint8Array<ArrayBuffer>, totalBytes: number): Uint8Array<ArrayBuffer> {
  const buf = new Uint8Array(new ArrayBuffer(totalBytes));
  buf.set(magic, 0);
  return buf;
}

function makeUploadRequest(file: File): Request {
  const form = new FormData();
  form.append('resume', file);
  return {
    headers: new Headers(),
    formData: async () => form,
  } as unknown as Request;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/student/resume/upload — Massive Data Sets & Extreme High Bounds Scaling (Variation 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeParser.hasValidFileSignature).mockReturnValue(true);
    vi.mocked(resumeParser.parseResume).mockResolvedValue(MASSIVE_PARSED_RESUME);
  });

  // -------------------------------------------------------------------------
  // Test 1 — Near-limit file (just under 5 MB) is accepted and parsed
  // -------------------------------------------------------------------------
  it('accepts and parses a PDF that is just under the 5 MB size limit', async () => {
    const NEAR_LIMIT = 5 * 1024 * 1024 - 1;
    const file = new File([buildBuffer(PDF_MAGIC, NEAR_LIMIT)], 'near-limit.pdf', {
      type: 'application/pdf',
    });

    const start = performance.now();
    const res = await POST(makeUploadRequest(file));
    const duration = performance.now() - start;

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.fileName).toBe('near-limit.pdf');
    // Even with a ~5 MB in-memory buffer the route must respond within 10 s.
    expect(duration).toBeLessThan(10_000);
  });

  // -------------------------------------------------------------------------
  // Test 2 — Exactly 1 byte over 5 MB is rejected with the correct error
  // -------------------------------------------------------------------------
  it('rejects a file that exceeds the 5 MB limit by exactly 1 byte', async () => {
    const OVER_LIMIT = 5 * 1024 * 1024 + 1;
    const file = new File([buildBuffer(PDF_MAGIC, OVER_LIMIT)], 'over-limit.pdf', {
      type: 'application/pdf',
    });

    const res = await POST(makeUploadRequest(file));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('5MB');
  });

  // -------------------------------------------------------------------------
  // Test 3 — 50 concurrent uploads complete without contention errors
  // -------------------------------------------------------------------------
  it('handles 50 concurrent upload requests without errors or stalling', async () => {
    const SMALL_BUF = buildBuffer(PDF_MAGIC, 1024);
    const requests = Array.from({ length: 50 }, (_, i) => {
      const file = new File([SMALL_BUF], `concurrent-${i}.pdf`, { type: 'application/pdf' });
      return POST(makeUploadRequest(file));
    });

    const start = performance.now();
    const responses = await Promise.all(requests);
    const duration = performance.now() - start;

    for (const res of responses) {
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    }

    expect(duration).toBeLessThan(15_000);
  });

  // -------------------------------------------------------------------------
  // Test 4 — Pathologically long filename does not crash the route
  // -------------------------------------------------------------------------
  it('accepts a valid PDF whose filename is 10 000 characters long', async () => {
    // The route echoes the filename back but does not validate its length.
    const LONG_NAME = 'a'.repeat(10_000) + '.pdf';
    const file = new File([buildBuffer(PDF_MAGIC, 2048)], LONG_NAME, {
      type: 'application/pdf',
    });

    const res = await POST(makeUploadRequest(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.fileName).toBe(LONG_NAME);
  });

  // -------------------------------------------------------------------------
  // Test 5 — Parser returning 500 skills does not corrupt or truncate the
  //          response payload
  // -------------------------------------------------------------------------
  it('returns a complete response payload even when the parser yields 500 skills', async () => {
    const file = new File([buildBuffer(DOCX_MAGIC, 4096)], 'massive-resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const res = await POST(makeUploadRequest(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // All 500 skills must survive serialisation — no truncation.
    expect(Array.isArray(body.data.skills)).toBe(true);
    expect(body.data.skills).toHaveLength(500);
    expect(body.data.skills[0]).toBe('Skill_0');
    expect(body.data.skills[499]).toBe('Skill_499');
  });
});
