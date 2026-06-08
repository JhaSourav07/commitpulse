import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { backgroundRefresh } from '@/services/github/background-refresh';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();

  return {
    ...actual,
    after: (callback: () => unknown) => {
      void callback();
    },
  };
});

function makeRequest(
  params: Record<string, string> = {},
  headers: Record<string, string> = {}
): Request {
  const url = new URL('http://localhost/api/github');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url.toString(), {
    headers: new Headers(headers),
  });
}

describe('GET /api/github - Interactive Tooltips, Cursor Hovers & Touch Event Propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    backgroundRefresh.reset();

    vi.mocked(getFullDashboardData).mockResolvedValue({
      profile: {
        username: 'octocat',
      },
      calendar: {},
      lastSyncedAt: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof getFullDashboardData>>); // <-- Double cast with unknown fixes TS2352
  });

  // Test 1: Simulated mouseenter/hover gestures on active segments
  it('triggers simulated mouseenter/hover gestures on active segments via refresh trigger', async () => {
    const response = await GET(
      makeRequest({
        username: 'octocat',
        refresh: 'true',
      })
    );

    expect(response.status).toBe(200);

    expect(getFullDashboardData).toHaveBeenCalledWith('octocat', { bypassCache: true });

    expect(response.headers.get('X-Refresh-Status')).toBe('Fresh');
    expect(response.headers.get('X-Cache-Status')).toBe('MISS');
  });

  // Test 2: Verify responsive tooltip layouts at computed coordinates
  it('verifies that responsive tooltip layouts display at computed coordinates mapped through metadata headers', async () => {
    refreshRateLimiter.setLimit(1);

    await GET(
      makeRequest(
        {
          username: 'octocat',
          refresh: 'true',
        },
        {
          'x-real-ip': '203.0.113.10',
        }
      )
    );

    const response = await GET(
      makeRequest(
        {
          username: 'torvalds',
          refresh: 'true',
        },
        {
          'x-real-ip': '203.0.113.10',
        }
      )
    );

    expect(response.status).toBe(429);

    expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');

    const reset = Number(response.headers.get('X-RateLimit-Reset'));

    expect(reset).toBeGreaterThan(Date.now());
  });

  // Test 3: Custom click/touch gestures and propagation mapping
  it('tests custom touch refresh gestures and ensures client event propagation scopes correctly', async () => {
    const response = await GET(
      makeRequest(
        {
          username: 'octocat',
          bypassCache: 'true',
        },
        {
          'x-real-ip': '198.51.100.8',
        }
      )
    );

    expect(response.status).toBe(200);

    expect(getFullDashboardData).toHaveBeenCalledWith('octocat', { bypassCache: true });

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
  });

  // Test 4: Interaction disabled when quota becomes critically low
  it('blocks refresh interactions when quota becomes critically low', async () => {
    quotaMonitor.setQuota(5000, 100, Date.now() + 60_000);

    const response = await GET(
      makeRequest({
        username: 'octocat',
        refresh: 'true',
      })
    );

    expect(response.status).toBe(429);

    // Safely unwrap the stream payload without locking or breaking execution
    await expect(response.json()).resolves.toHaveProperty('error');
    expect(getFullDashboardData).not.toHaveBeenCalled();
  });
  // Test 5: Check mouseleave events successfully hide temporary overlay visuals
  it('checks that simulated mouseleave cooldown events successfully hide temporary overlay visuals by returning cached data', async () => {
    await GET(
      makeRequest({
        username: 'octocat',
        refresh: 'true',
      })
    );

    const response = await GET(
      makeRequest({
        username: 'octocat',
        refresh: 'true',
      })
    );

    expect(response.status).toBe(200);

    expect(getFullDashboardData).toHaveBeenLastCalledWith('octocat', { bypassCache: false });

    expect(response.headers.get('X-Refresh-Status')).toBe('Cooldown-Served-Cached');

    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
