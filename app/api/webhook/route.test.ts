import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import crypto from 'crypto';

const makeRequest = (headers: Record<string, string>, body: string) => {
  const url = 'http://localhost:3000/api/webhook';
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body,
  });
};

describe('POST /api/webhook', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 500 when GITHUB_WEBHOOK_SECRET is not set', async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;

    const req = makeRequest(
      {
        'content-length': '15',
        'x-hub-signature-256': 'sha256=somesignature',
      },
      '{"test": "data"}'
    );

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Webhook secret is not configured');
  });

  it('returns 401 when signature header is missing', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'secret_key';

    const req = makeRequest(
      {
        'content-length': '15',
      },
      '{"test": "data"}'
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Missing signature');
  });

  it('returns 401 for invalid signature', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'secret_key';

    const req = makeRequest(
      {
        'content-length': '15',
        'x-hub-signature-256': 'sha256=invalidsignature',
      },
      '{"test": "data"}'
    );

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('returns 200 and processes webhook successfully with valid signature', async () => {
    const secret = 'secret_key';
    process.env.GITHUB_WEBHOOK_SECRET = secret;

    const payload = '{"test":"data"}';
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');

    const req = makeRequest(
      {
        'content-length': payload.length.toString(),
        'x-hub-signature-256': signature,
      },
      payload
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('Webhook received securely');
  });

  it('returns 413 when payload exceeds 1MB', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'secret_key';
    const largePayload = 'x'.repeat(1024 * 1024 + 1);
    const req = makeRequest(
      {
        'content-length': (1024 * 1024 + 1).toString(),
        'x-hub-signature-256': 'sha256=somesignature',
      },
      largePayload
    );
    const res = await POST(req);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toBe('Payload too large');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'secret_key';
    const secret = 'secret_key';
    const payload = '{"test":"data"}';
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');

    for (let i = 0; i < 10; i++) {
      await POST(
        makeRequest(
          {
            'content-length': payload.length.toString(),
            'x-hub-signature-256': signature,
            'x-forwarded-for': '192.168.1.1',
          },
          payload
        )
      );
    }

    const res = await POST(
      makeRequest(
        {
          'content-length': payload.length.toString(),
          'x-hub-signature-256': signature,
          'x-forwarded-for': '192.168.1.1',
        },
        payload
      )
    );
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe('Too many requests');
  });

  it('returns 401 when signature is missing sha256= prefix', async () => {
    process.env.GITHUB_WEBHOOK_SECRET = 'secret_key';
    const req = makeRequest(
      {
        'content-length': '15',
        'x-hub-signature-256': 'invalidsignaturewithoutprefix',
      },
      '{"test": "data"}'
    );
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('returns 400 when body is invalid JSON after signature passes', async () => {
    const secret = 'secret_key';
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    const payload = 'this is not json';
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');
    const req = makeRequest(
      {
        'content-length': payload.length.toString(),
        'x-hub-signature-256': signature,
      },
      payload
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON');
  });
});
