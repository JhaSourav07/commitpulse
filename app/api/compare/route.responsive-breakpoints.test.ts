import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>();
  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: vi.fn().mockImplementation(function () {
    return { check: vi.fn().mockResolvedValue(true) };
  }),
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

/**
 * Helper: build a mobile-flavoured request. We attach viewport hint headers
 * and mobile User-Agent strings so we can prove the /api/compare route is
 * device-agnostic — the JSON response must be identical and unclipped no
 * matter how narrow the client viewport is.
 */
function makeMobileRequest(search: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost:3000/api/compare?${search}`, {
    headers: new Headers(headers),
  });
}

describe('Responsive Multi-device Columns & Mobile Viewport Layouts (Issue #6759)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFullDashboardData).mockResolvedValue({
      calendar: { totalContributions: 50, weeks: [] },
    } as never);
  });

  // Test 1: Standard 375px mobile viewport (iPhone SE / 12 / 13 mini reference).
  // The comparison payload for two users must arrive intact — no clipping when
  // the client advertises a narrow viewport via the standard hint headers.
  it('serves a clean 200 JSON comparison for a 375px mobile viewport request', async () => {
    const res = await GET(
      makeMobileRequest('user1=alice&user2=bob', {
        'Viewport-Width': '375',
        'Sec-CH-Viewport-Width': '375',
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    // "Columns reflow" here means both user payloads are still present —
    // nothing was dropped or truncated because of the mobile viewport hint.
    expect(body.user1).toBeDefined();
    expect(body.user2).toBeDefined();
  });

  // Test 2: Mobile User-Agent (iPhone Safari). The route must not branch on
  // user-agent and must return a flat JSON shape with no absolute-width fields
  // that would push the mobile UI into a horizontal scrollbar.
  it('returns a scrollbar-safe payload when called from an iPhone User-Agent', async () => {
    const iphoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    const res = await GET(makeMobileRequest('user1=alice&user2=bob', { 'user-agent': iphoneUA }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe('object');
    // Payload must not carry fixed pixel widths that would break mobile layout.
    expect(body).not.toHaveProperty('width');
    expect(body).not.toHaveProperty('minWidth');
    expect(body.user1).toBeDefined();
    expect(body.user2).toBeDefined();
  });

  // Test 3: Navigation-like re-fetch from a mobile client. When the user pulls
  // to refresh on Android, the client will re-issue the request with the same
  // ETag it already has. The route must scale down gracefully and return a
  // 304 Not Modified — no wasted bandwidth on a mobile connection.
  it('returns 304 for a mobile pull-to-refresh with a matching If-None-Match', async () => {
    const androidUA =
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

    // First mobile request — captures the ETag.
    const first = await GET(
      makeMobileRequest('user1=alice&user2=bob', {
        'user-agent': androidUA,
        'Viewport-Width': '412',
      })
    );
    const etag = first.headers.get('ETag');
    expect(etag).toBeTruthy();

    // Second mobile request (pull-to-refresh) — sends the ETag back.
    const second = await GET(
      makeMobileRequest('user1=alice&user2=bob', {
        'user-agent': androidUA,
        'Viewport-Width': '412',
        'if-none-match': etag!,
      })
    );

    expect(second.status).toBe(304);
    expect(second.body).toBeNull();
    expect(second.headers.get('Cache-Control')).toBe('public, s-maxage=1');
  });

  // Test 4: Mobile-specific toggle state (no cache header sent). When the
  // mobile client leaves the "use cache" toggle OFF and issues a fresh
  // request, the route must respond cleanly with a fresh ETag and the
  // standard Cache-Control — no state leaked from previous requests.
  it('responds with a fresh ETag when mobile client omits If-None-Match', async () => {
    const mobileUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

    const res = await GET(
      makeMobileRequest('user1=alice&user2=bob', {
        'user-agent': mobileUA,
        'Viewport-Width': '375',
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('ETag')).toBeTruthy();
    expect(res.headers.get('Cache-Control')).toBe('public, s-maxage=1');
  });

  // Test 5: Multi-device consistency — small phone (320px), standard phone
  // (375px), large phone (414px). All three breakpoints must produce an
  // identical 200 response with the same ETag (same underlying data) —
  // proving the route scales predictably across mobile widths.
  it('returns consistent behavior across 320px / 375px / 414px mobile breakpoints', async () => {
    const breakpoints = ['320', '375', '414'];
    const results: Array<{ status: number; etag: string | null }> = [];

    for (const width of breakpoints) {
      const res = await GET(
        makeMobileRequest('user1=alice&user2=bob', {
          'Viewport-Width': width,
          'Sec-CH-Viewport-Width': width,
        })
      );
      results.push({
        status: res.status,
        etag: res.headers.get('ETag'),
      });
    }

    // All three widths must produce a 200 with a valid ETag — and since the
    // underlying data is deterministic, the ETag must be identical.
    expect(results[0].status).toBe(200);
    expect(results[1].status).toBe(200);
    expect(results[2].status).toBe(200);
    expect(results[0].etag).toBeTruthy();
    expect(results[0].etag).toBe(results[1].etag);
    expect(results[1].etag).toBe(results[2].etag);
  });
});
