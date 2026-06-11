import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { RateLimiter } from '@/lib/rate-limit';

function signedRequest(body: string, secret: string, signature?: string): Request {
  const digest =
    signature ?? `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': digest,
    },
    body,
  });
}

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);
    process.env.GITHUB_WEBHOOK_SECRET = 'configured-test-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

  it('fails closed when the webhook secret is not configured', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const publicFallbackSignature = `sha256=${crypto
      .createHmac('sha256', 'development_secret')
      .update('{}')
      .digest('hex')}`;

    const response = await POST(signedRequest('{}', 'unused', publicFallbackSignature));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Webhook is not configured' });
  });

  it('accepts a payload signed with the configured secret', async () => {
    const response = await POST(signedRequest('{"action":"opened"}', 'configured-test-secret'));

    expect(response.status).toBe(200);
  });

  it('rejects signatures generated with the old public fallback secret', async () => {
    const response = await POST(signedRequest('{}', 'development_secret'));

    expect(response.status).toBe(401);
  });

  it('rejects malformed signatures before comparison', async () => {
    const response = await POST(signedRequest('{}', 'unused', 'sha256=not-hex'));

    expect(response.status).toBe(401);
  });

  it('uses a fixed route bucket instead of attacker-controlled forwarding headers', async () => {
    const checkSpy = vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);
    const request = new Request('http://localhost/api/webhook', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.10',
        'x-hub-signature-256': `sha256=${crypto
          .createHmac('sha256', 'configured-test-secret')
          .update('{}')
          .digest('hex')}`,
      },
      body: '{}',
    });

    await POST(request);

    expect(checkSpy).toHaveBeenCalledWith('github-webhook');
  });

  it('returns 429 when the bounded webhook limiter rejects the request', async () => {
    vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValueOnce(false);

    const response = await POST(signedRequest('{}', 'configured-test-secret'));

    expect(response.status).toBe(429);
  });
});
