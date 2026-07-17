import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const { mockConfig } = vi.hoisted(() => {
  return {
    mockConfig: {
      useRealRateLimit: false,
      realRateLimit: null as unknown as typeof rateLimit,
      realGetRateLimitHeaders: null as unknown as typeof getRateLimitHeaders,
    },
  };
});

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  mockConfig.realRateLimit = actual.rateLimit;
  mockConfig.realGetRateLimitHeaders = actual.getRateLimitHeaders;
  return {
    ...actual,
    rateLimit: vi.fn(),
    getRateLimitHeaders: vi.fn(),
  };
});

describe('middleware', () => {
  beforeEach(() => {
    mockConfig.useRealRateLimit = false;
    vi.clearAllMocks();

    vi.mocked(rateLimit).mockImplementation(async (ip, limit, windowMs, namespace) => {
      if (mockConfig.useRealRateLimit) {
        return mockConfig.realRateLimit(ip, limit, windowMs, namespace);
      }
      return {
        success: true,
        limit: 60,
        remaining: 59,
        reset: 123456789,
      };
    });

    vi.mocked(getRateLimitHeaders).mockImplementation((result) => {
      return mockConfig.realGetRateLimitHeaders(result);
    });
  });

  it('calls NextResponse.next when rate limit succeeds', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    await middleware(request);

    expect(nextSpy).toHaveBeenCalled();
  });

  it('returns 429 when rate limit fails', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.status).toBe(429);
  });

  it('returns too many requests error body when rate limit fails', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    await expect(response.json()).resolves.toEqual({
      error: 'Too many requests',
    });
  });

  it('sets X-RateLimit-Limit header when rate limit succeeds', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('sets X-RateLimit-Remaining header when rate limit succeeds', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
  });

  it('uses connection IP (request.ip) if present', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    Object.defineProperty(request, 'ip', { value: '203.0.113.10', writable: true });

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000, 'api');
  });

  it('ignores spoofed X-Forwarded-For when request.ip is present', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      },
    });
    Object.defineProperty(request, 'ip', { value: '203.0.113.10', writable: true });

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('203.0.113.10', 60, 60000, 'api');
  });

  it('defaults to 127.0.0.1 when no request.ip and headers are untrusted/missing', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('127.0.0.1', 60, 60000, 'api');
  });
});

let testTime = new Date(2026, 5, 26, 12, 0, 0);

describe('middleware integration tests (rate-limit spoofing prevention)', () => {
  beforeEach(() => {
    mockConfig.useRealRateLimit = true;
    vi.useFakeTimers();
    testTime = new Date(testTime.getTime() + 120000);
    vi.setSystemTime(testTime);

    vi.mocked(rateLimit).mockImplementation(async (ip, limit, windowMs, namespace) => {
      return mockConfig.realRateLimit(ip, limit, windowMs, namespace);
    });
    vi.mocked(getRateLimitHeaders).mockImplementation((result) => {
      return mockConfig.realGetRateLimitHeaders(result);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function makeNextRequest(ip?: string, headers: Record<string, string> = {}): NextRequest {
    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', { headers });
    if (ip) {
      Object.defineProperty(request, 'ip', { value: ip, writable: true });
    }
    return request;
  }

  it('Scenario 1: Default (No trusted proxies) ignores spoofed headers and locks rate limit to default/connection IP', async () => {
    // No TRUSTED_PROXIES env is set, and VERCEL is not set.
    // If request.ip is undefined, all requests resolve to 127.0.0.1 (defaultIp in test mode)
    // 60 requests should pass, the 61st should be rate-limited.
    for (let i = 0; i < 60; i++) {
      const request = makeNextRequest(undefined, {
        'x-forwarded-for': `192.0.2.${i}`, // Rotating spoofed XFF header
      });
      const response = await middleware(request);
      expect(response.status).toBe(200);
    }

    // The 61st request should be rate-limited to 429
    const request61 = makeNextRequest(undefined, {
      'x-forwarded-for': '192.0.2.99',
    });
    const response61 = await middleware(request61);
    expect(response61.status).toBe(429);

    // Any other spoofed header should STILL get 429 because it maps to 127.0.0.1
    const request62 = makeNextRequest(undefined, {
      'x-forwarded-for': '192.0.2.100',
    });
    const response62 = await middleware(request62);
    expect(response62.status).toBe(429);
  });

  it('Scenario 1b: Default (No trusted proxies) uses connection IP (request.ip) and ignores spoofed X-Forwarded-For', async () => {
    const connectionIp = '192.0.2.200'; // Unique IP for this test to avoid cache pollution

    // 60 requests from the same connection IP should pass, even if X-Forwarded-For is different
    for (let i = 0; i < 60; i++) {
      const request = makeNextRequest(connectionIp, {
        'x-forwarded-for': `1.2.3.${i}`,
      });
      const response = await middleware(request);
      expect(response.status).toBe(200);
    }

    // 61st request should be rate-limited
    const request61 = makeNextRequest(connectionIp, {
      'x-forwarded-for': '1.2.3.99',
    });
    const response61 = await middleware(request61);
    expect(response61.status).toBe(429);

    // Changing the spoofed header value does NOT bypass the rate limit
    const request62 = makeNextRequest(connectionIp, {
      'x-forwarded-for': '9.9.9.9',
    });
    const response62 = await middleware(request62);
    expect(response62.status).toBe(429);
  });

  it('Scenario 2: Wildcard trust (TRUSTED_PROXIES=*) trusts leftmost X-Forwarded-For IP', async () => {
    vi.stubEnv('TRUSTED_PROXIES', '*');

    // We'll use client IPs in the 198.51.100.x range.
    const clientIp = '198.51.100.10';

    // 60 requests with XFF leftmost IP = clientIp should pass
    for (let i = 0; i < 60; i++) {
      const request = makeNextRequest(undefined, {
        'x-forwarded-for': `${clientIp}, 10.0.0.1, 10.0.0.2`,
      });
      const response = await middleware(request);
      expect(response.status).toBe(200);
    }

    // 61st request with same clientIp should be rate-limited
    const request61 = makeNextRequest(undefined, {
      'x-forwarded-for': `${clientIp}, 10.0.0.1, 10.0.0.2`,
    });
    const response61 = await middleware(request61);
    expect(response61.status).toBe(429);

    // Changing the leftmost IP (the true client under wildcard trust) should bypass the rate limit
    const differentClientIp = '198.51.100.11';
    const request62 = makeNextRequest(undefined, {
      'x-forwarded-for': `${differentClientIp}, 10.0.0.1, 10.0.0.2`,
    });
    const response62 = await middleware(request62);
    expect(response62.status).toBe(200);
  });

  it('Scenario 2b: VERCEL=1 behaves as wildcard trust', async () => {
    vi.stubEnv('VERCEL', '1');
    const clientIp = '198.51.100.20';

    // 60 requests should pass
    for (let i = 0; i < 60; i++) {
      const request = makeNextRequest(undefined, {
        'x-forwarded-for': `${clientIp}, 10.0.0.1`,
      });
      const response = await middleware(request);
      expect(response.status).toBe(200);
    }

    // 61st request should be rate-limited
    const request61 = makeNextRequest(undefined, {
      'x-forwarded-for': `${clientIp}, 10.0.0.1`,
    });
    const response61 = await middleware(request61);
    expect(response61.status).toBe(429);
  });

  it('Scenario 3: Custom trusted proxies reject X-Forwarded-For if no direct peer is established', async () => {
    vi.stubEnv('TRUSTED_PROXIES', '192.0.2.1, 10.0.0.0/8');

    // Request with undefined request.ip.
    // X-Forwarded-For should be rejected and resolved to 127.0.0.1.
    for (let i = 0; i < 60; i++) {
      const request = makeNextRequest(undefined, {
        'x-forwarded-for': `198.51.100.${i}`,
      });
      const response = await middleware(request);
      expect(response.status).toBe(200);
    }

    // 61st request gets 429
    const request61 = makeNextRequest(undefined, {
      'x-forwarded-for': '198.51.100.99',
    });
    const response61 = await middleware(request61);
    expect(response61.status).toBe(429);
  });
});
