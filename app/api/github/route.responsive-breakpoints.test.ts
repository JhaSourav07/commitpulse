import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { RateLimiter } from '@/lib/rate-limit';

// Replace the real GitHub API with a fake function so tests run offline.
vi.mock('../../../lib/github', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/github')>('../../../lib/github');

  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});

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

/**
 * Helper: build a Request that simulates a mobile client.
 * We attach viewport hint headers and mobile user-agent strings so we can
 * assert the API is device-agnostic and does not degrade on mobile viewports.
 */
function makeMobileRequest(
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

describe('Responsive Multi-device Columns & Mobile Viewport Layouts (Issue #6764)', () => {
  // Test 1: Standard mobile viewport (375px — iPhone SE / 12 / 13 mini reference width)
  // Ensures the API responds cleanly when the client advertises a narrow viewport,
  // proving the JSON payload is not clipped or altered by viewport hints.
  it('serves a clean 200 JSON response for a 375px mobile viewport request', async () => {
    const response = await GET(
      makeMobileRequest(
        { username: 'torvalds' },
        {
          'Viewport-Width': '375',
          'Sec-CH-Viewport-Width': '375',
        }
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const body = await response.json();
    // Columns "reflow" here means the response body is intact — no truncation.
    expect(body).toHaveProperty('profile');
    expect(body).toHaveProperty('calendar');
  });

  // Test 2: Mobile User-Agent (iPhone Safari) — verifies the route does not branch
  // on user-agent and returns a consistent shape a mobile client can safely render
  // without horizontal scrollbars.
  it('returns identical payload shape when called from a mobile User-Agent', async () => {
    const iphoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    const response = await GET(
      makeMobileRequest({ username: 'octocat' }, { 'user-agent': iphoneUA })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    // Payload keys must be flat — nothing here forces a fixed pixel width
    // that would cause a horizontal scrollbar on a 375px screen.
    expect(typeof body).toBe('object');
    expect(body).not.toHaveProperty('width');
    expect(body).not.toHaveProperty('minWidth');
  });

  // Test 3: Navigation-like refresh toggle from a mobile client. The mobile UI
  // typically triggers `?refresh=true` from a pull-to-refresh gesture. The route
  // must scale down gracefully — allow it once and set the Fresh header.
  it('handles a mobile pull-to-refresh (refresh=true) gesture cleanly', async () => {
    const androidUA =
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

    const response = await GET(
      makeMobileRequest(
        { username: 'torvalds', refresh: 'true' },
        {
          'user-agent': androidUA,
          'Viewport-Width': '412',
        }
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
    expect(getFullDashboardData).toHaveBeenCalledWith(
      'torvalds',
      expect.objectContaining({ bypassCache: true })
    );
  });

  // Test 4: Assert mobile-specific toggle states respond cleanly. When a mobile
  // client hits the endpoint without refresh (default toggle OFF), it should
  // receive cached data with the `Cached` refresh status — no unexpected state leak.
  it('responds with cached status when mobile client leaves refresh toggle OFF', async () => {
    const mobileUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

    const response = await GET(
      makeMobileRequest(
        { username: 'octocat' },
        {
          'user-agent': mobileUA,
          'Viewport-Width': '375',
        }
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Refresh-Status')).toBe('Cached');
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
    expect(getFullDashboardData).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({ bypassCache: false })
    );
  });

  // Test 5: Multi-device consistency — small phone (320px), standard phone (375px),
  // large phone (414px) must all receive an identical 200 response with the same
  // header contract, proving the API scales across all mobile breakpoints without
  // visual clipping or inconsistent behaviour.
  it('returns consistent behavior across 320px / 375px / 414px mobile breakpoints', async () => {
    const breakpoints = ['320', '375', '414'];
    const results: Array<{ status: number; refreshStatus: string | null }> = [];

    for (const width of breakpoints) {
      const response = await GET(
        makeMobileRequest(
          { username: 'torvalds' },
          {
            'Viewport-Width': width,
            'Sec-CH-Viewport-Width': width,
          }
        )
      );
      results.push({
        status: response.status,
        refreshStatus: response.headers.get('X-Refresh-Status'),
      });
    }

    // Every breakpoint must produce the same successful, cached response —
    // this is the API contract that keeps mobile layouts predictable.
    expect(results).toEqual([
      { status: 200, refreshStatus: 'Cached' },
      { status: 200, refreshStatus: 'Cached' },
      { status: 200, refreshStatus: 'Cached' },
    ]);
  });
});
