import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import crypto from 'crypto';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
  getRateLimitHeaders: vi.fn().mockReturnValue({ 'X-RateLimit-Limit': '10' }),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/services/github/webhook-handler', () => ({
  parseWebhookEvent: vi.fn(),
  cacheEvent: vi.fn().mockResolvedValue(undefined),
  evaluateAlerts: vi.fn().mockResolvedValue(undefined),
}));

import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { parseWebhookEvent, cacheEvent, evaluateAlerts } from '@/services/github/webhook-handler';

const WEBHOOK_SECRET = 'test-webhook-secret-123';

function createSignedPayload(payload: object, secret: string): { body: string; signature: string } {
  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const signature = `sha256=${hmac.digest('hex')}`;
  return { body, signature };
}

function makeRequest(
  payload: object,
  options?: { secret?: string; signature?: string; headers?: Record<string, string> }
): Request {
  const secret = options?.secret ?? WEBHOOK_SECRET;
  const { body, signature: autoSignature } = createSignedPayload(payload, secret);
  const signature = options?.signature ?? autoSignature;

  return new Request('http://localhost:3000/api/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(body.length),
      'x-hub-signature-256': signature,
      'x-forwarded-for': '127.0.0.1',
      ...options?.headers,
    },
    body,
  });
}

describe('POST /api/webhook', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GITHUB_WEBHOOK_SECRET: WEBHOOK_SECRET };
    vi.mocked(rateLimit).mockResolvedValue({ success: true } as never);
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── Signature Verification ─────────────────────────────────────────────

  it('returns 500 when GITHUB_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const { body } = createSignedPayload({ action: 'completed' }, 'any-secret');
    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(body.length),
        'x-hub-signature-256': 'sha256=abc',
        'x-forwarded-for': '127.0.0.1',
      },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 401 when signature is missing', async () => {
    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({ action: 'completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when signature is invalid', async () => {
    const req = makeRequest({ action: 'completed' }, { signature: 'sha256=invalidsignature' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // ── Payload Validation ─────────────────────────────────────────────────

  it('returns 400 for empty request body', async () => {
    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=fakesig',
        'x-forwarded-for': '127.0.0.1',
      },
      body: '',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const secret = WEBHOOK_SECRET;
    const bodyText = 'not-json';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(bodyText);
    const signature = `sha256=${hmac.digest('hex')}`;

    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(bodyText.length),
        'x-hub-signature-256': signature,
        'x-forwarded-for': '127.0.0.1',
      },
      body: bodyText,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── Rate Limiting ──────────────────────────────────────────────────────

  it('returns 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false } as never);

    const req = makeRequest({ action: 'completed' });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  // ── Event Processing ───────────────────────────────────────────────────

  it('processes CI/CD events and returns success', async () => {
    const mockEvent = {
      type: 'workflow_run' as const,
      repository: 'user/repo',
      timestamp: new Date().toISOString(),
      status: 'success' as const,
      details: {
        id: 123,
        name: 'CI',
        runNumber: 1,
        branch: 'main',
        commit: 'abc1234',
        message: 'test',
        author: 'test',
      },
    };

    vi.mocked(parseWebhookEvent).mockReturnValue(mockEvent);

    const req = makeRequest({
      workflow_run: { id: 123, status: 'completed', conclusion: 'success' },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.event.type).toBe('workflow_run');
    expect(data.event.repository).toBe('user/repo');
    expect(parseWebhookEvent).toHaveBeenCalled();
    expect(cacheEvent).toHaveBeenCalledWith(mockEvent);
    expect(evaluateAlerts).toHaveBeenCalledWith(mockEvent);
  });

  it('returns success for non-CI/CD events', async () => {
    vi.mocked(parseWebhookEvent).mockReturnValue(null);

    const req = makeRequest({ action: 'opened', pull_request: { number: 1 } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('not a CI/CD event');
    expect(cacheEvent).not.toHaveBeenCalled();
  });

  it('returns 500 when processing fails', async () => {
    vi.mocked(parseWebhookEvent).mockImplementation(() => {
      throw new Error('Processing failed');
    });

    const req = makeRequest({ workflow_run: { id: 123 } });
    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  // ── Ping Events ────────────────────────────────────────────────────────

  it('handles ping events gracefully', async () => {
    vi.mocked(parseWebhookEvent).mockReturnValue(null);

    const req = makeRequest({ zen: 'Keep it simple' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
