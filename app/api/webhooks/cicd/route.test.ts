import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

vi.mock('@/services/github/webhook-handler', () => ({
  parseWebhookEvent: vi.fn(() => null),
  cacheEvent: vi.fn(),
  evaluateAlerts: vi.fn(),
  generateCIReport: vi.fn(),
  setAlertConfig: vi.fn(),
}));

const { POST } = await import('./route');

const makeRequest = (headers: Record<string, string>, body: string) => {
  return new NextRequest('http://localhost:3000/api/webhooks/cicd', {
    method: 'POST',
    headers,
    body,
  });
};

describe('POST /api/webhooks/cicd', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, WEBHOOK_SECRET: 'test_secret' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 401 (not 500) for a malformed/short signature header', async () => {
    const body = '{"test": "data"}';
    const req = makeRequest({ 'x-hub-signature-256': 'sha256=abc' }, body);

    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('returns 401 for a signature missing the sha256= prefix', async () => {
    const body = '{"test": "data"}';
    const req = makeRequest({ 'x-hub-signature-256': 'abc123' }, body);

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a well-formed but incorrect signature', async () => {
    const body = '{"test": "data"}';
    const wrongHex = 'a'.repeat(64);
    const req = makeRequest({ 'x-hub-signature-256': `sha256=${wrongHex}` }, body);

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('accepts a correctly signed payload', async () => {
    const body = '{"test": "data"}';
    const sig = 'sha256=' + crypto.createHmac('sha256', 'test_secret').update(body).digest('hex');
    const req = makeRequest({ 'x-hub-signature-256': sig }, body);

    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});
