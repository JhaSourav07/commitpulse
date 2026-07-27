import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { RateLimiter } from '@/lib/rate-limit';

// Stub the async service layer (lib/github.ts) so tests never hit the real
// GitHub API or the real cache backend — this is the "asynchronous service
// layer mocking" the local cache/database call is routed through.
vi.mock('../../../lib/github', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/github')>('../../../lib/github');

  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});

// `after()` normally defers to background execution outside a request scope;
// run it synchronously here so cache-sync assertions don't need to race it.
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(RateLimiter.prototype, 'check').mockResolvedValue(true);
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

afterEach(() => {
  vi.useRealTimers();
});

describe('GET /api/github — async service layer & local cache stubs', () => {
  it('queries the local cache layer before falling through to a fresh service call', async () => {
    // A plain request (no `refresh`/`bypassCache` flag) must ask the service
    // layer to use its cache rather than forcing a fresh fetch.
    const response = await GET(makeRequest({ username: 'torvalds' }));

    expect(response.status).toBe(200);
    expect(getFullDashboardData).toHaveBeenCalledTimes(1);
    expect(getFullDashboardData).toHaveBeenCalledWith(
      'torvalds',
      expect.objectContaining({ bypassCache: false })
    );
  });

  it('bypasses the cache and hits the service layer directly for an explicit refresh', async () => {
    const response = await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));

    expect(response.status).toBe(200);
    expect(getFullDashboardData).toHaveBeenCalledWith(
      'torvalds',
      expect.objectContaining({ bypassCache: true })
    );
    expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
  });

  it('falls back with a 504 when the stubbed service call never resolves before the timeout window closes', async () => {
    vi.useFakeTimers();

    // Simulate a hung upstream call: the mock never resolves on its own,
    // it only rejects once the route's AbortController fires — exactly
    // like the real fetch-based implementation in lib/github.ts.
    vi.mocked(getFullDashboardData).mockImplementation(
      (_username: string, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const abortErr = new Error('This operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        })
    );

    const pending = GET(makeRequest({ username: 'torvalds' }));

    // Advance past the route's 10s upstream timeout.
    await vi.advanceTimersByTimeAsync(10_000);

    const response = await pending;
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.error).toContain('timed out');
  });

  it('serves the cached fallback instead of bypassing when a repeated refresh is blocked by cooldown', async () => {
    // First refresh is allowed and hits the service layer fresh.
    await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));
    expect(getFullDashboardData).toHaveBeenLastCalledWith(
      'torvalds',
      expect.objectContaining({ bypassCache: true })
    );

    // A second refresh within the cooldown window must fall back to the
    // cached read rather than issuing another fresh service call.
    const response = await GET(makeRequest({ username: 'torvalds', refresh: 'true' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.error).toBeUndefined();
    expect(getFullDashboardData).toHaveBeenLastCalledWith(
      'torvalds',
      expect.objectContaining({ bypassCache: false })
    );
    expect(response.headers.get('X-Refresh-Status')).toBe('Cooldown-Served-Cached');
  });

  it('writes a full cache sync via background refresh only after a successful, stale cache read', async () => {
    const staleTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: { lastSyncedAt: staleTime },
      calendar: {},
    } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>);

    const syncSpy = vi.spyOn(backgroundRefresh, 'triggerRefresh');

    const response = await GET(makeRequest({ username: 'torvalds' }));

    expect(response.status).toBe(200);
    expect(syncSpy).toHaveBeenCalledWith('torvalds');
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });
});
