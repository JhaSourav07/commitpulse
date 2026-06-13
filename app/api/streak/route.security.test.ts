import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { GET } from './route';
import { streakParamsSchema } from '@/lib/validations';

// Stub core internal modules to prevent cascading unmocked downstream network fetches
vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(() =>
    Promise.resolve({
      calendar: { totalContributions: 0, weeks: [] },
      isOfflineFallback: false,
    })
  ),
  getOrgDashboardData: vi.fn(),
}));

let bypassCallCount = 0;

// Mock the core rate limiter library with isolated environment variables
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn((key: unknown) => {
    // FIX #2: Strict type check boundary validation guard to prevent execution failures
    if (typeof key === 'string' && key.includes('bypassCache:')) {
      bypassCallCount++;
      if (bypassCallCount > 3) {
        return Promise.resolve({ success: false, limit: 3, remaining: 0, reset: 600000 });
      }
      return Promise.resolve({
        success: true,
        limit: 3,
        remaining: 3 - bypassCallCount,
        reset: 600000,
      });
    }
    return Promise.resolve({ success: true, limit: 60, remaining: 59, reset: 60000 });
  }),
}));

describe('Streak Endpoint - Security & Timezone Resilience Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bypassCallCount = 0; // Fixes internal memory leaks across multi-test runners
    vi.stubEnv('KV_REST_API_URL', ''); // Fixes the dangerous global process mock overwrite
    vi.stubEnv('KV_REST_API_TOKEN', '');
  });

  // Security Verification Path: Cache Bypass Sliding Window Bucket Rate Limiter Checks
  it('enforces a strict rate-limiting barrier of 3 requests max per 10-minute window block for cache bypass queries', async () => {
    const createBypassRequest = () =>
      new NextRequest('http://localhost:3000/api/streak?user=octocat&refresh=true', {
        headers: { 'x-forwarded-for': '192.168.1.50' },
      });

    const res1 = await proxy(createBypassRequest());
    expect(res1.status).toBeLessThan(400);

    const res2 = await proxy(createBypassRequest());
    expect(res2.status).toBeLessThan(400);

    const res3 = await proxy(createBypassRequest());
    expect(res3.status).toBeLessThan(400);

    const res4 = await proxy(createBypassRequest());
    expect(res4.status).toBe(429);
  });

  // Resilience Verification Path: Forced Timezone RangeError Exception Mapping Checks
  it('safely intercepts native Intl RangeErrors and gracefully builds a structured 400 SVG card', async () => {
    const fakeParsedData = {
      success: true,
      data: {
        user: 'octocat',
        tz: 'ForcedTriggerTimezoneString',
      },
    } as unknown as ReturnType<typeof streakParamsSchema.safeParse>;

    const zodSpy = vi.spyOn(streakParamsSchema, 'safeParse').mockReturnValue(fakeParsedData);

    const constructibleMock = function () {
      throw new RangeError('unsupported time zone');
    } as unknown as typeof Intl.DateTimeFormat;

    const dateTimeFormatSpy = vi
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation(constructibleMock);

    const dummyRequest = new Request('http://localhost:3000/api/streak?user=octocat&tz=UTC');
    const response = await GET(dummyRequest);

    dateTimeFormatSpy.mockRestore();
    zodSpy.mockRestore();

    expect(response.status).toBe(400);
    const svgContent = await response.text();
    expect(svgContent).toContain('svg');
  });
});
