import { NextRequest } from 'next/server';
import { POST } from './route';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the services so we don't actually write to the cache during tests
vi.mock('@/services/github/webhook-handler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/github/webhook-handler')>();
  return {
    ...actual,
    setAlertConfig: vi.fn().mockResolvedValue(undefined),
  };
});

describe('[Bug fix] webhookUrl validation', () => {
  const TEST_SECRET = 'test-secret-token';
  const validAuthHeader = `Bearer ${TEST_SECRET}`;

  beforeEach(() => {
    // Set the environment variable expected by the route handler
    process.env.CICD_ALERTS_SECRET = TEST_SECRET;
  });

  it('rejects a non-https webhookUrl', async () => {
    const req = new NextRequest('http://localhost/api/cicd/alerts', {
      method: 'POST',
      headers: { authorization: validAuthHeader, 'content-type': 'application/json' },
      body: JSON.stringify({
        repository: 'owner/repo',
        webhookUrl: 'http://example.com/webhook',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('Invalid webhookUrl');
  });

  it('rejects a webhookUrl pointing at localhost', async () => {
    const req = new NextRequest('http://localhost/api/cicd/alerts', {
      method: 'POST',
      headers: { authorization: validAuthHeader, 'content-type': 'application/json' },
      body: JSON.stringify({
        repository: 'owner/repo',
        webhookUrl: 'https://localhost/webhook',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts a valid https webhookUrl', async () => {
    const req = new NextRequest('http://localhost/api/cicd/alerts', {
      method: 'POST',
      headers: { authorization: validAuthHeader, 'content-type': 'application/json' },
      body: JSON.stringify({
        repository: 'owner/repo',
        webhookUrl: 'https://example.com/webhook',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
