import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware, config } from './middleware';
import { rateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

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

  it('calls rateLimit with fixed policy values (60 requests / 60000ms)', async () => {
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
});
