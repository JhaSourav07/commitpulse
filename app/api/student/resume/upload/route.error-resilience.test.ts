// app/api/student/resume/upload/route.error-resilience.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

import { parseResume, hasValidFileSignature } from '@/lib/resume-parser';
import logger from '@/lib/logger';
import { validateCSRF } from '@/lib/security/csrf';
import { RateLimiter } from '@/lib/rate-limit';

vi.mock('@/lib/resume-parser', () => ({
  parseResume: vi.fn(),
  hasValidFileSignature: vi.fn(),
  ALLOWED_MIME_TYPES: ['application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024,
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCSRF: vi.fn(() => null),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

function makeRequest(file: File): Request {
  const form = new FormData();
  form.append('resume', file);

  return {
    formData: vi.fn().mockResolvedValue(form),
  } as unknown as Request;
}

describe('POST error resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(validateCSRF).mockReturnValue(null);
    vi.mocked(hasValidFileSignature).mockReturnValue(true);

    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 422 when parseResume throws unexpectedly', async () => {
    vi.mocked(parseResume).mockRejectedValue(new Error('database offline'));

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    const res = await POST(makeRequest(file));

    expect(res.status).toBe(422);

    const body = await res.json();

    expect(body).toEqual({
      success: false,
      error: 'Failed to parse resume. Please enter your details manually.',
    });

    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('logs the original exception', async () => {
    const err = new Error('parser crashed');

    vi.mocked(parseResume).mockRejectedValue(err);

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    await POST(makeRequest(file));

    expect(logger.error).toHaveBeenCalledWith('Failed to parse resume', {
      error: err,
    });
  });

  it('returns 422 when arrayBuffer rejects', async () => {
    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('disk failure'));

    const res = await POST(makeRequest(file));

    expect(res.status).toBe(422);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('returns 422 when Buffer construction path fails', async () => {
    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    vi.spyOn(file, 'arrayBuffer').mockResolvedValue(Symbol() as unknown as ArrayBuffer);

    const res = await POST(makeRequest(file));

    expect(res.status).toBe(422);
    expect(logger.error).toHaveBeenCalledOnce();
  });

  it('never exposes internal exception details', async () => {
    vi.mocked(parseResume).mockRejectedValue(
      new Error('Mongo connection refused at localhost:27017')
    );

    const file = new File(['pdf'], 'resume.pdf', {
      type: 'application/pdf',
    });

    const res = await POST(makeRequest(file));

    expect(res.status).toBe(422);

    const body = await res.json();

    expect(body.error).toBe('Failed to parse resume. Please enter your details manually.');

    expect(body.error).not.toContain('Mongo');
    expect(body.error).not.toContain('localhost');
    expect(body.error).not.toContain('connection');
  });
});
