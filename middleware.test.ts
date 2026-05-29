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

  it('calls NextResponse.next when rate limit succeeds', () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    middleware(request);

    expect(nextSpy).toHaveBeenCalled();
  });

  it('returns 429 when rate limit fails', () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = middleware(request);

    expect(response.status).toBe(429);
  });

  it('returns too many requests error body when rate limit fails', async () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = middleware(request);

    await expect(response.json()).resolves.toEqual({
      error: 'Too many requests',
    });
  });

  it('sets X-RateLimit-Limit header when rate limit succeeds', () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('sets X-RateLimit-Remaining header when rate limit succeeds', () => {
    vi.mocked(rateLimit).mockReturnValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = middleware(request);

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
  });
});
