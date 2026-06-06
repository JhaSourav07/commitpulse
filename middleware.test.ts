import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware, config } from './middleware';
import { rateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

// Helper: build a rateLimit mock that returns success for the first call
// and a given result for the second call (used when both limiters fire).
function mockBothLimiters(
  refreshResult: Awaited<ReturnType<typeof rateLimit>>,
  generalSuccess = true
) {
  vi.mocked(rateLimit).mockResolvedValueOnce(refreshResult).mockResolvedValueOnce({
    success: generalSuccess,
    limit: 60,
    remaining: 59,
    reset: 123456789,
  });
}

describe('middleware', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.TRUSTED_PROXIES;
    // Set trusted proxies to make standard multi-hop tests pass as trusted proxy chains
    process.env.TRUSTED_PROXIES = '5.6.7.8, 9.10.11.12';
  });

  afterEach(() => {
    process.env.TRUSTED_PROXIES = originalEnv;
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

  it('calls rateLimit with fixed policy values (60 requests / 60000ms) for normal requests', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith(expect.any(String), 60, 60000);
  });

  it('sets all X-RateLimit headers on successful requests', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789');
  });

  it('keeps headers present on the returned response object (regression)', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 58,
      reset: 111,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('58');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('111');
  });

  it('sets JSON and rate headers on throttled responses', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789');
  });

  it('uses first IP from x-forwarded-for when subsequent hops are trusted', async () => {
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

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('1.2.3.4', 60, 60000);
  });

  it('ignores spoofed x-forwarded-for when subsequent hops are untrusted', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    // Clear trusted proxies so 5.6.7.8 is untrusted
    process.env.TRUSTED_PROXIES = '';

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      },
    });

    await middleware(request);

    // Should resolve to the untrusted proxy IP (5.6.7.8) instead of the spoofed client IP (1.2.3.4)
    expect(rateLimit).toHaveBeenCalledWith('5.6.7.8', 60, 60000);
  });

  it('uses x-real-ip if x-forwarded-for is missing', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-real-ip': '9.9.9.9',
      },
    });

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('9.9.9.9', 60, 60000);
  });

  it('defaults to 127.0.0.1 when no IP headers', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('127.0.0.1', 60, 60000);
  });

  it('prefers x-forwarded-for over x-real-ip', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'x-real-ip': '9.9.9.9',
      },
    });

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('1.2.3.4', 60, 60000);
  });

  it('handles multiple IPs with whitespace', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat', {
      headers: {
        'x-forwarded-for': '1.2.3.4,  5.6.7.8,  9.10.11.12',
      },
    });

    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith('1.2.3.4', 60, 60000);
  });

  it('includes compare API matcher in middleware config', () => {
    expect(config.matcher).toContain('/api/compare/:path*');
  });

  it('includes wrapped and student API matchers in middleware config', () => {
    expect(config.matcher).toContain('/api/wrapped/:path*');
    expect(config.matcher).toContain('/api/student/:path*');
  });

  // ─── ?refresh=true rate-limit tests ───────────────────────────────────────

  describe('?refresh=true cache-bypass rate limit', () => {
    it('applies the refresh limiter (5 req/min) before the general limiter', async () => {
      // Both limiters succeed
      mockBothLimiters({ success: true, limit: 5, remaining: 4, reset: 123456789 });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      await middleware(request);

      // First call must be the refresh limiter with the prefixed key
      expect(rateLimit).toHaveBeenNthCalledWith(1, 'refresh:127.0.0.1', 5, 60000);
      // Second call must be the general limiter with the bare IP
      expect(rateLimit).toHaveBeenNthCalledWith(2, '127.0.0.1', 60, 60000);
    });

    it('returns 429 with refresh-specific message when refresh limit is exceeded', async () => {
      mockBothLimiters({ success: false, limit: 5, remaining: 0, reset: 123456789 });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      const response = await middleware(request);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toContain('refresh');
    });

    it('response limit header is 5 (not 60) when the refresh rate limit is exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValueOnce({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 123456789,
      });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      const response = await middleware(request);

      // The refresh limiter has limit=5, so the header must reflect that — not 60
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.status).toBe(429);
    });

    it('does NOT invoke the general limiter when the refresh limit is exceeded', async () => {
      // Only the refresh limiter fires (returns fail); general limiter must not be called.
      vi.mocked(rateLimit).mockResolvedValueOnce({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 123456789,
      });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      await middleware(request);

      // The general-limiter call always uses (bare IP, 60, 60000) — it must not appear.
      expect(rateLimit).not.toHaveBeenCalledWith('127.0.0.1', 60, 60000);
    });

    it('sets X-RateLimit-Limit to 5 on a blocked refresh request', async () => {
      vi.mocked(rateLimit).mockResolvedValueOnce({
        success: false,
        limit: 5,
        remaining: 0,
        reset: 999999,
      });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      const response = await middleware(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('skips the refresh limiter when refresh param is absent', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: true,
        limit: 60,
        remaining: 59,
        reset: 123456789,
      });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
      await middleware(request);

      // Only the general limiter should be called
      expect(rateLimit).toHaveBeenCalledTimes(1);
      expect(rateLimit).toHaveBeenCalledWith('127.0.0.1', 60, 60000);
    });

    it('skips the refresh limiter when refresh=false', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: true,
        limit: 60,
        remaining: 59,
        reset: 123456789,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/streak?user=octocat&refresh=false'
      );
      await middleware(request);

      expect(rateLimit).toHaveBeenCalledTimes(1);
      expect(rateLimit).not.toHaveBeenCalledWith(expect.stringContaining('refresh:'), 5, 60000);
    });

    it('still applies general limiter when refresh succeeds', async () => {
      mockBothLimiters({ success: true, limit: 5, remaining: 3, reset: 123456789 });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      const response = await middleware(request);

      // Both limiters ran and overall request succeeded
      expect(rateLimit).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    it('returns 429 from general limiter even when refresh succeeds', async () => {
      // refresh OK, general fails
      vi.mocked(rateLimit)
        .mockResolvedValueOnce({ success: true, limit: 5, remaining: 2, reset: 123456789 })
        .mockResolvedValueOnce({ success: false, limit: 60, remaining: 0, reset: 123456789 });

      const request = new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true');
      const response = await middleware(request);

      expect(response.status).toBe(429);
      const body = await response.json();
      // The general-limiter error body does NOT mention "refresh"
      expect(body.error).toBe('Too many requests');
    });
  });
});
