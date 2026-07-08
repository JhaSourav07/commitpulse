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

vi.mock('@/lib/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/github')>();
  return {
    ...actual,
    getFullDashboardData: vi.fn(),
  };
});

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
describe('GitHub route error resilience', () => {
  it('returns 404 when user is not found', async () => {
    vi.mocked(getFullDashboardData).mockRejectedValueOnce({
      status: 404,
      message: 'User not found',
    });

    const response = await GET(makeRequest());

    expect(response.status).toBe(404);

    expect(await response.json()).toEqual({
      error: 'User not found',
    });
  });
});
it('returns 403 when GitHub API rate limit is reached', async () => {
  vi.mocked(getFullDashboardData).mockRejectedValueOnce({
    status: 403,
    message: 'API Rate Limit Exceeded',
  });

  const response = await GET(makeRequest());

  expect(response.status).toBe(403);

  expect(await response.json()).toEqual({
    error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.',
  });
});

it('returns 500 for unexpected internal errors', async () => {
  vi.mocked(getFullDashboardData).mockRejectedValueOnce(new Error('Unexpected database failure'));

  const response = await GET(makeRequest());

  expect(response.status).toBe(500);

  expect(await response.json()).toEqual({
    error: 'Unexpected database failure',
  });
});
it('unwraps nested error causes and returns 404', async () => {
  vi.mocked(getFullDashboardData).mockRejectedValueOnce(
    new Error('Outer wrapper', {
      cause: new Error('User not found'),
    })
  );

  const response = await GET(makeRequest());

  expect(response.status).toBe(404);

  expect(await response.json()).toEqual({
    error: 'User not found',
  });
});

it('does not crash when stale cache triggers background refresh', async () => {
  const { backgroundRefresh } = await import('@/services/github/background-refresh');

  vi.mocked(backgroundRefresh.isStale).mockReturnValueOnce(true);

  vi.mocked(getFullDashboardData).mockResolvedValueOnce({
    profile: {},
    repositories: [],
    lastSyncedAt: '2023-01-01T00:00:00.000Z',
  } as never);

  const response = await GET(makeRequest());

  expect(response.status).toBe(200);

  expect(backgroundRefresh.triggerRefresh).toHaveBeenCalledWith('octocat');
});
