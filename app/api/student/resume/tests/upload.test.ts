import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '../upload/route';
import { MAX_FILE_SIZE } from '@/lib/resume-parser';

vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    check = vi.fn().mockResolvedValue(true);
    checkWithResult = vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });
  }

  return {
    RateLimiter: MockRateLimiter,
    getRateLimitHeaders: vi.fn(() => ({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '4',
      'X-RateLimit-Reset': Date.now().toString(),
    })),
  };
});

const originalFormData = globalThis.FormData;

afterEach(() => {
  globalThis.FormData = originalFormData;
});

// Build the handler request directly from a real File/FormData so the file bytes are
// preserved (the multipart transport itself is Next.js's responsibility, not this route's).
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

function makeEmptyUploadRequest(): Request {
  const form = new FormData();
  return {
    headers: new Headers(),
    formData: async () => form,
  } as unknown as Request;
}

describe('POST /api/student/resume/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for a disallowed mime type', async () => {
    const response = await POST(makeUploadRequest('hello', 'text/html', 'note.html'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid file type');
  });

  it('returns 400 when content does not match the declared PDF type', async () => {
    const response = await POST(
      makeUploadRequest('<!DOCTYPE html><html></html>', 'application/pdf', 'evil.pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('does not match');
  });

  it('accepts a file whose bytes match the declared PDF type', async () => {
    const response = await POST(
      makeUploadRequest('%PDF-1.7\nJohn Doe\njohn@example.com', 'application/pdf')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('returns 400 when no resume file is provided in the form data', async () => {
    const response = await POST(makeEmptyUploadRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('No resume file');
  });

  it('returns 400 for a file exceeding the size limit', async () => {
    const oversized = new ArrayBuffer(MAX_FILE_SIZE + 1);
    const largeFile = new File([oversized], 'large.pdf', { type: 'application/pdf' });
    const form = new FormData();
    form.append('resume', largeFile);

    const request = {
      headers: new Headers(),
      formData: async () => form,
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('5MB');
  });
});
