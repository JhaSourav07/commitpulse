import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware as proxy } from './middleware';
import { rateLimit } from './lib/rate-limit';

vi.mock('./lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('proxy.accessibility - Middleware Responsibilities (JSON responses, rate limits, headers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides a structured JSON error response when the general rate limit is exceeded', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak');
    const response = await proxy(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({ error: 'Too many requests' });
  });

  it('provides a structured JSON error response when the refresh rate limit is exceeded', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?refresh=true');
    const response = await proxy(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Too many refresh requests. Please wait before bypassing the cache again.',
    });
  });

  it('exposes rate limit information transparently via headers on successful requests', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak');
    const response = await proxy(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789');
  });

  it('exposes correct rate limit policy headers on refresh requests', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?bypassCache=true');
    const response = await proxy(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Policy')).toBe('refresh');
  });

  it('allows the request to proceed when within acceptable rate limits', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 45,
      reset: 123456789,
    });

    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/streak');
    await proxy(request);

    expect(nextSpy).toHaveBeenCalled();
  });
});
