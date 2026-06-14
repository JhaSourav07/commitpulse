import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { rateLimit } from './lib/rate-limit';

vi.mock('./lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

describe('Middleware rate-limit consistency', () => {
  it('returns consistent JSON error shape when rate limit is exceeded', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });
    const generalResponse = await middleware(new NextRequest('http://localhost:3000/api/streak'));
    expect(generalResponse.status).toBe(429);
    expect(await generalResponse.json()).toEqual({ error: 'Too many requests' });

    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });
    const refreshResponse = await middleware(
      new NextRequest('http://localhost:3000/api/streak?refresh=true')
    );
    expect(refreshResponse.status).toBe(429);
    expect(await refreshResponse.json()).toEqual({ error: 'Too many requests' });
  });

  it('includes rate limit headers on limited responses', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });
    const limited = await middleware(new NextRequest('http://localhost:3000/api/streak'));
    expect(limited.headers.has('X-RateLimit-Limit')).toBe(true);
    expect(limited.headers.has('X-RateLimit-Remaining')).toBe(true);
    expect(limited.headers.has('X-RateLimit-Reset')).toBe(true);
  });

  it('includes rate limit headers on successful responses', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: 123456789,
    });
    const response = await middleware(new NextRequest('http://localhost:3000/api/streak'));
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('59');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('123456789');
  });

  it('returns 429 status on rate limited responses', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 60,
      remaining: 0,
      reset: 123456789,
    });
    const response = await middleware(new NextRequest('http://localhost:3000/api/streak'));
    expect(response.status).toBe(429);
  });

  it('middleware config matcher covers all expected API route patterns', async () => {
    const { config: mwConfig } = await import('./middleware');
    const expectedRoutes = [
      '/api/streak/:path*',
      '/api/github/:path*',
      '/api/track-user/:path*',
      '/api/stats/:path*',
      '/api/og/:path*',
      '/api/pr-insights/:path*',
    ];
    for (const route of expectedRoutes) {
      expect(mwConfig.matcher).toContain(route);
    }
  });

  it('exports middleware function and config from middleware.ts', async () => {
    const mod = await import('./middleware');
    expect(typeof mod.middleware).toBe('function');
    expect(mod.config).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
    expect(mod.config.matcher.length).toBeGreaterThan(0);
  });
});
