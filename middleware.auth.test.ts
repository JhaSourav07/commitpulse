import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';
import { auth } from './auth';
import type { Session } from 'next-auth';

vi.mock('./lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 60,
    remaining: 59,
    reset: 123456789,
  }),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('./auth', () => ({
  auth: vi.fn(),
}));

const mockAuth = vi.mocked(auth as unknown as () => Promise<Session | null>);

describe('middleware auth and authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENTERPRISE_ADMIN_GITHUB_IDS', '');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unauthenticated request to /api/enterprise/teams returns 401', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/enterprise/teams');
    const response = await middleware(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication required' });
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('authenticated request to /api/enterprise/teams returns 503 if ENTERPRISE_ADMIN_GITHUB_IDS is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user123' } } as unknown as Session);
    vi.stubEnv('ENTERPRISE_ADMIN_GITHUB_IDS', '');

    const request = new NextRequest('http://localhost:3000/api/enterprise/teams');
    const response = await middleware(request);

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({ error: 'Enterprise admin access not configured' });
  });

  it('authenticated request to /api/enterprise/teams returns 403 if user is not an enterprise admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user123' } } as unknown as Session);
    vi.stubEnv('ENTERPRISE_ADMIN_GITHUB_IDS', 'admin1,admin2');

    const request = new NextRequest('http://localhost:3000/api/enterprise/teams');
    const response = await middleware(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: 'Forbidden: enterprise admin access required' });
  });

  it('authenticated request to /api/enterprise/teams passes if user is an enterprise admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1' } } as unknown as Session);
    vi.stubEnv('ENTERPRISE_ADMIN_GITHUB_IDS', 'admin1,admin2');
    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/enterprise/teams');
    const response = await middleware(request);

    expect(nextSpy).toHaveBeenCalled();
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('unauthenticated request to /api/architecture returns 401', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/architecture');
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('authenticated request to /api/architecture passes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user123' } } as unknown as Session);
    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/architecture');
    await middleware(request);

    expect(nextSpy).toHaveBeenCalled();
  });

  it('unauthenticated request to /api/streak passes', async () => {
    mockAuth.mockResolvedValue(null);
    const nextSpy = vi.spyOn(NextResponse, 'next');

    const request = new NextRequest('http://localhost:3000/api/streak?user=octocat');
    await middleware(request);

    expect(nextSpy).toHaveBeenCalled();
    expect(auth).not.toHaveBeenCalled();
  });
});
