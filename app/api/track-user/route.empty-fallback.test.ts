import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('@/models/User', () => ({ User: { updateOne: vi.fn() } }));
vi.mock('@/utils/getClientIp', () => ({ getClientIp: vi.fn(() => '127.0.0.1') }));
vi.mock('@/lib/rate-limit', () => ({
  getRateLimitHeaders: vi.fn(() => ({})),
  trackUserRateLimiter: { checkWithResult: vi.fn(() => ({ success: true })) },
}));
vi.mock('@/services/security/track-user-protection', () => ({
  trackUserProtection: {
    verifyAndDeduplicate: vi.fn(() => ({ allowed: true })),
    recordWrite: vi.fn(),
  },
}));

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/track-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('track-user route — Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (process.env as Record<string, string | undefined>).MONGODB_URI;
  });

  it('returns 400 when username is missing from body', async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or missing username');
  });

  it('returns 400 when username is empty string', async () => {
    const res = await POST(makeRequest({ username: '' }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or missing username');
  });

  it('returns 400 when username is null', async () => {
    const res = await POST(makeRequest({ username: null }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or missing username');
  });

  it('returns 400 when body is malformed JSON', async () => {
    const req = new Request('http://localhost/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Malformed JSON request body');
  });

  it('returns 400 when username is a number instead of string', async () => {
    const res = await POST(makeRequest({ username: 12345 }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or missing username');
  });
});
