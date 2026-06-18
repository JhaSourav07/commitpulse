import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/rate-limit', () => {
  class MockRateLimiter {
    check = vi.fn().mockResolvedValue(true);
  }
  return { RateLimiter: MockRateLimiter };
});

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

function makeRequest(formDataFn: () => Promise<FormData> | FormData): Request {
  return {
    headers: new Headers(),
    formData: async () => formDataFn(),
  } as unknown as Request;
}

describe('POST /api/student/resume/upload - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('returns 400 when the resume field is missing from FormData', async () => {
    const form = new FormData(); // no 'resume' key
    const req = makeRequest(() => form);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('No resume file provided');
  });

  it('returns 400 when the resume field is an empty string, not a File', async () => {
    const form = new FormData();
    form.append('resume', ''); // empty string, not a File
    const req = makeRequest(() => form);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 400 when file MIME type is empty', async () => {
    const file = new File(['content'], 'resume.pdf', { type: '' });
    const form = new FormData();
    form.append('resume', file);
    const req = makeRequest(() => form);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid file type');
  });

  it('returns 400 when the file is empty (zero bytes)', async () => {
    const file = new File([], 'resume.pdf', { type: 'application/pdf' });
    const form = new FormData();
    form.append('resume', file);
    const req = makeRequest(() => form);
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('does not match');
  });

  it('returns 400 when formData() throws due to malformed body', async () => {
    const req = {
      headers: new Headers(),
      formData: async () => {
        throw new Error('Malformed multipart body');
      },
    } as unknown as Request;
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid form data');
  });
});
