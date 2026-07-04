import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const deleteMock = vi.fn(async () => true);
vi.mock('@/lib/github', () => ({
  contributionsCache: { delete: deleteMock },
  cacheKey: (kind: string, username: string, year?: string) =>
    year ? `${kind}:${username.toLowerCase()}:${year}` : `${kind}:${username.toLowerCase()}`,
}));

const rateLimitMock = vi.fn(async () => ({
  success: true,
  limit: 1,
  remaining: 0,
  reset: Date.now() + 60000,
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: rateLimitMock,
}));

const { POST } = await import('./route');

const SECRET = 'push-webhook-secret';

const sign = (body: string, secret = SECRET) =>
  'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

const makeRequest = (body: string, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3000/api/webhooks/github', {
    method: 'POST',
    headers: {
      'x-github-event': 'push',
      'x-hub-signature-256': sign(body),
      ...headers,
    },
    body,
  });

const pushPayload = JSON.stringify({
  pusher: { name: 'octocat' },
  sender: { login: 'octocat' },
});

describe('POST /api/webhooks/github', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GITHUB_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 500 when the webhook secret is not configured', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const res = await POST(makeRequest(pushPayload));
    expect(res.status).toBe(500);
  });

  it('returns 401 when the signature header is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/github', {
      method: 'POST',
      headers: { 'x-github-event': 'push' },
      body: pushPayload,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a signature made with the wrong secret', async () => {
    const res = await POST(
      makeRequest(pushPayload, { 'x-hub-signature-256': sign(pushPayload, 'wrong') })
    );
    expect(res.status).toBe(401);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('responds to ping events without touching the cache', async () => {
    const body = JSON.stringify({ zen: 'Keep it logically awesome.' });
    const res = await POST(makeRequest(body, { 'x-github-event': 'ping' }));
    expect(res.status).toBe(200);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('acknowledges but ignores non-push events', async () => {
    const res = await POST(makeRequest(pushPayload, { 'x-github-event': 'issues' }));
    expect(res.status).toBe(202);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('invalidates the default and current-year contribution cache on push', async () => {
    const res = await POST(makeRequest(pushPayload));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.revalidated).toBe(true);
    expect(data.username).toBe('octocat');

    const year = String(new Date().getUTCFullYear());
    expect(deleteMock).toHaveBeenCalledWith('contributions:octocat');
    expect(deleteMock).toHaveBeenCalledWith(`contributions:octocat:${year}`);
  });

  it('rate limits repeated pushes to one revalidation per username per minute', async () => {
    rateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 1,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    const res = await POST(makeRequest(pushPayload));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain('already performed');
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('rejects payloads that do not identify a valid pusher', async () => {
    const body = JSON.stringify({ pusher: { name: '../../etc/passwd' } });
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(422);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON that carries a valid signature', async () => {
    const body = 'not-json';
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
  });
});
