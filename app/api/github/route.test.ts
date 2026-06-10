import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Replace the real GitHub API with a fake function
vi.mock('../../../lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

// Run after() callbacks synchronously in tests (outside a request scope it is otherwise a no-op).
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    after: (fn: () => unknown) => {
      void fn();
    },
  };
});

import { getFullDashboardData } from '../../../lib/github';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { backgroundRefresh } from '@/services/github/background-refresh';

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
): Request {
  const url = new URL('http://localhost/api/github');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString(), {
    headers: new Headers(headers),
  });
}

describe('GET /api/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { lastSyncedAt: new Date().toISOString() },
      calendar: {},
      lastSyncedAt: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>);

    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    backgroundRefresh.reset();
  });

  describe('Unrestricted Cache Bypass & Abuse Mitigation (Issue #1978)', () => {
    // Scenario 1: Normal cached request
    it('Scenario 1: serves cached data and checks SWR background refresh', async () => {
      // Mock data that is stale (15 minutes ago)
      const staleTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      vi.mocked(getFullDashboardData).mockResolvedValue({
        profile: { lastSyncedAt: staleTime },
        calendar: {},
      } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>);

      const triggerSpy = vi.spyOn(backgroundRefresh, 'triggerRefresh');

      const response = await GET(makeRequest({ username: 'torvalds' }));
      expect(response.status).toBe(200);
      expect(getFullDashboardData).toHaveBeenCalledWith('torvalds', { bypassCache: false });
      expect(triggerSpy).toHaveBeenCalledWith('torvalds');
    });

    // Scenario 2: Single refresh request allowed
    it('Scenario 2: allows a single refresh request when limits are respected', async () => {
      const response = await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));

      expect(response.status).toBe(200);
      expect(getFullDashboardData).toHaveBeenCalledWith('torvalds', { bypassCache: true });
      expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
    });

    // Scenario 3: Repeated refresh within cooldown served from cache
    it('Scenario 3: serves cached response for repeated refresh requests within cooldown', async () => {
      // First refresh is allowed
      await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));
      expect(getFullDashboardData).toHaveBeenLastCalledWith('torvalds', { bypassCache: true });

      // Second refresh within cooldown (5 minutes)
      const response = await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));

      expect(response.status).toBe(200);
      // Cooldown fallback triggers cached read
      expect(getFullDashboardData).toHaveBeenLastCalledWith('torvalds', { bypassCache: false });
      expect(response.headers.get('X-Refresh-Status')).toBe('Cooldown-Served-Cached');
    });

    // Scenario 4: Refresh rate limit exceeded per client IP
    it('Scenario 4: returns 429 when client refresh rate limit is exceeded', async () => {
      // Set rate limit to 2 per window for testing
      refreshRateLimiter.setLimit(2);

      // Refresh 1
      await GET(
        makeRequest({ username: 'torvalds', refresh: 'true' }, { 'x-real-ip': '203.0.113.5' })
      );
      // Refresh 2
      await GET(
        makeRequest({ username: 'octocat', refresh: 'true' }, { 'x-real-ip': '203.0.113.5' })
      );

      // Refresh 3 (exceeds limit of 2)
      const response = await GET(
        makeRequest({ username: 'torvalds', refresh: 'true' }, { 'x-real-ip': '203.0.113.5' })
      );

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toContain('Refresh rate limit exceeded');
    });

    // Scenario 5: Low GitHub quota blocks refresh
    it('Scenario 5: blocks manual refresh when remaining GitHub quota is low (<10%)', async () => {
      // Set global remaining quota to 400 out of 5000 (8%)
      quotaMonitor.setQuota(5000, 400, Date.now() + 60000);

      const response = await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toContain('quota is low');
      expect(getFullDashboardData).not.toHaveBeenCalled();
    });

    // Scenario 6: Background refresh execution
    it('Scenario 6: asynchronous background refresh completes successfully', async () => {
      const loadSpy = vi.spyOn(backgroundRefresh, 'triggerRefresh');

      // Mock data that is stale
      const staleTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      vi.mocked(getFullDashboardData).mockResolvedValue({
        profile: { lastSyncedAt: staleTime },
        calendar: {},
      } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>);

      await GET(makeRequest({ username: 'torvalds' }));

      expect(loadSpy).toHaveBeenCalledWith('torvalds');
    });
  });

  describe('Standard route behavior', () => {
    it('returns 400 when username contains invalid characters', async () => {
      const response = await GET(makeRequest({ username: '@@@@@' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid parameters');
    });

    it('returns 400 when username contains only whitespace', async () => {
      const response = await GET(makeRequest({ username: '   ' }));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid parameters');
    });

    it('returns 400 when username is missing', async () => {
      const response = await GET(makeRequest());
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('Invalid parameters');
    });

    it('returns 404 when getFullDashboardData throws User not found', async () => {
      vi.mocked(getFullDashboardData).mockRejectedValue(new Error('User not found'));

      const response = await GET(makeRequest({ username: 'octocat' }));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain('User not found');
    });
  });
});
