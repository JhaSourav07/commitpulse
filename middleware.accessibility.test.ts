import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { proxy as middleware } from './proxy';
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
    const response = await middleware(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({ error: 'Too many requests' });
  });

  it('provides a structured JSON error response when rate limit is exceeded on any route', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?refresh=true');
    const response = await middleware(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual({ error: 'Too many requests' });
  });

  it('exposes rate limit information transparently via headers on successful requests', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789');
  });

  it('exposes correct rate limit headers on rate limited responses', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });

    const request = new NextRequest('http://localhost:3000/api/streak');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
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
    await middleware(request);

    expect(nextSpy).toHaveBeenCalled();
  });
});
