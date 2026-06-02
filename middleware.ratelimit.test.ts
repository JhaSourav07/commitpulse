import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { config, middleware } from './middleware';
import { rateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('middleware rate-limit behavior', () => {
  it('calls rateLimit with fixed policy values (60 requests / 60000ms)', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 1700000000,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    await middleware(request);

    expect(rateLimit).toHaveBeenCalledWith(expect.any(String), 60, 60000);
  });

  it('sets all X-RateLimit headers on successful requests', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 58,
      reset: 1700000100,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('58');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1700000100');
  });

  it('returns 429 with structured JSON body when throttled', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 1700000200,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: 'Too many requests' });
  });

  it('sets JSON and rate headers on throttled responses', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 1700000300,
    });

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    const response = await middleware(request);

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('1700000300');
  });

  it('includes compare API matcher in middleware config', () => {
    expect(config.matcher).toContain('/api/compare/:path*');
  });
});
