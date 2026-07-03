import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ---------------------------
 * Mocks
 * -------------------------- */

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');

  return {
    ...actual,
    after: vi.fn((cb: () => void) => cb()),
  };
});

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/services/github/quota-monitor', () => ({
  quotaMonitor: {
    isQuotaLow: vi.fn(() => false),
    getQuota: vi.fn(() => ({
      remaining: 5000,
    })),
  },
}));

vi.mock('@/services/github/refresh-policy', () => ({
  refreshPolicy: {
    isRefreshAllowed: vi.fn(() => true),
    recordRefresh: vi.fn(),
    getRemainingCooldown: vi.fn(() => 0),
  },
}));

vi.mock('@/services/github/refresh-rate-limiter', () => ({
  refreshRateLimiter: {
    checkLimit: vi.fn(() => ({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 60000,
    })),
  },
}));

vi.mock('@/services/github/background-refresh', () => ({
  backgroundRefresh: {
    isStale: vi.fn(() => false),
    triggerRefresh: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/validations', () => ({
  githubParamsSchema: {
    safeParse: vi.fn(() => ({
      success: true,
      data: {
        username: 'octocat',
        refresh: false,
        bypassCache: false,
      },
    })),
  },
  coerceQueryParams: vi.fn((params) => params),
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';

const makeRequest = () => new Request('http://localhost:3000/api/github?username=octocat');

beforeEach(() => {
  vi.clearAllMocks();
});
describe('GET /api/github - mock integrations', () => {
  it('returns dashboard data when async GitHub service succeeds', async () => {
    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: {
        login: 'octocat',
      },
      repositories: [],
      lastSyncedAt: new Date().toISOString(),
    } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.profile.login).toBe('octocat');
    expect(getFullDashboardData).toHaveBeenCalledTimes(1);
  });

  it('queues a background refresh when cached data is stale', async () => {
    const { backgroundRefresh } = await import('@/services/github/background-refresh');

    vi.mocked(backgroundRefresh.isStale).mockReturnValueOnce(true);

    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: {
        login: 'octocat',
      },
      repositories: [],
      lastSyncedAt: '2024-01-01T00:00:00.000Z',
    } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);

    expect(backgroundRefresh.isStale).toHaveBeenCalled();

    expect(backgroundRefresh.triggerRefresh).toHaveBeenCalledWith('octocat');
  });
  it('does not trigger background refresh when cached data is fresh', async () => {
    const { backgroundRefresh } = await import('@/services/github/background-refresh');

    vi.mocked(backgroundRefresh.isStale).mockReturnValueOnce(false);

    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: {
        login: 'octocat',
      },
      repositories: [],
      lastSyncedAt: new Date().toISOString(),
    } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);

    expect(backgroundRefresh.isStale).toHaveBeenCalled();
    expect(backgroundRefresh.triggerRefresh).not.toHaveBeenCalled();
  });

  it('serves cached data when refresh cooldown blocks cache bypass', async () => {
    const { refreshPolicy } = await import('@/services/github/refresh-policy');

    const { githubParamsSchema } = await import('@/lib/validations');

    vi.mocked(githubParamsSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: {
        username: 'octocat',
        refresh: true,
        bypassCache: false,
      },
    } as never);

    vi.mocked(refreshPolicy.isRefreshAllowed).mockReturnValueOnce(false);

    vi.mocked(getFullDashboardData).mockResolvedValueOnce({
      profile: {
        login: 'octocat',
      },
      repositories: [],
      lastSyncedAt: new Date().toISOString(),
    } as never);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);

    expect(getFullDashboardData).toHaveBeenCalledWith(
      'octocat',
      expect.objectContaining({
        bypassCache: false,
      })
    );
  });

  it('returns 429 when refresh rate limiter blocks the request', async () => {
    const { refreshRateLimiter } = await import('@/services/github/refresh-rate-limiter');

    const { githubParamsSchema } = await import('@/lib/validations');

    vi.mocked(githubParamsSchema.safeParse).mockReturnValueOnce({
      success: true,
      data: {
        username: 'octocat',
        refresh: true,
        bypassCache: false,
      },
    } as never);

    vi.mocked(refreshRateLimiter.checkLimit).mockReturnValueOnce({
      success: false,
      limit: 3,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const response = await GET(makeRequest());

    expect(response.status).toBe(429);

    const body = await response.json();

    expect(body.error).toContain('Refresh rate limit exceeded');
  });
});
