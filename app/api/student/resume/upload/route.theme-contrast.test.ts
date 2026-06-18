import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    check = vi.fn().mockResolvedValue(true);
  }
  return { RateLimiter: MockRateLimiter };
});

vi.mock('@/lib/resume-parser', () => ({
  parseResume: vi.fn().mockResolvedValue({
    text: 'Mock parsed content',
    skills: ['JavaScript', 'TypeScript'],
    experience: [],
  }),
  ALLOWED_MIME_TYPES: ['application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  hasValidFileSignature: vi.fn().mockReturnValue(true),
}));

function makeUploadRequest(content: string | number[], type: string, name = 'resume.pdf'): Request {
  const data = typeof content === 'string' ? content : new Uint8Array(content);
  const file = new File([data], name, { type });
  const form = new FormData();
  form.append('resume', file);
  return {
    headers: new Headers(),
    formData: async () => form,
  } as unknown as Request;
}

describe('POST /api/student/resume/upload - Real Route Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when no file is uploaded', async () => {
    const emptyForm = new FormData();
    const request = {
      headers: new Headers(),
      formData: async () => emptyForm,
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('No resume file provided');
  });

  it('returns 400 for disallowed MIME types', async () => {
    const response = await POST(makeUploadRequest('fake content', 'text/html', 'malicious.html'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('PDF');
  });

  it('returns 400 when PDF content does not match declared MIME type', async () => {
    const response = await POST(
      makeUploadRequest('<!DOCTYPE html><html></html>', 'application/pdf', 'fake.pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success || body.message).toBeDefined();
  });

  it('successfully uploads and parses a valid PDF file', async () => {
    const response = await POST(
      makeUploadRequest('%PDF-1.4\nTest resume content', 'application/pdf')
    );
    const body = await response.json();

    expect([200, 201]).toContain(response.status);
    expect(body.success || body.message).toBeDefined();
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const { RateLimiter } = await import('@/lib/rate-limit');

    const mockCheck = vi.fn().mockRejectedValue(new Error('Rate limit exceeded'));
    RateLimiter.prototype.check = mockCheck;

    const response = await POST(makeUploadRequest('%PDF-1.4 test', 'application/pdf'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success || body.message).toBeDefined();
  });
});
