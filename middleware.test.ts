import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { rateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
