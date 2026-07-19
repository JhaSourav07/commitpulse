import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest } from 'node-mocks-http';
import { GET } from './route';
import { getWrappedData, getCircuitTelemetry } from '@/lib/github';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

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

vi.mock('@/lib/github', () => ({
  getWrappedData: vi.fn(),
  getCircuitTelemetry: vi.fn(() => ({
    isOpen: false,
    resetInMs: 0,
  })),
}));

describe('GET /api/wrapped validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getCircuitTelemetry).mockReturnValue({
      isOpen: false,
      resetInMs: 0,
    });

    vi.mocked(getWrappedData).mockResolvedValue({
      totalContributions: 1500,
      mostActiveDate: '2023-10-15',
      highestDailyCount: 50,
      busiestMonth: '2023-10',
      weekendRatio: 13,
      topLanguage: 'TypeScript',
      calendar: {
        totalContributions: 1500,
        weeks: [],
      },
    });

    vi.mocked(refreshRateLimiter.checkLimit).mockReturnValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Date.now() + 60000,
    });

    vi.mocked(refreshPolicy.isRefreshAllowed).mockReturnValue(true);
  });

  const makeMockRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost/api/wrapped');

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return createRequest({
      method: 'GET',
      url: url.toString(),
    }) as unknown as Request;
  };

  it('Test Case 1: refresh=true checks rate limiter and bypasses cache', async () => {
    const req = makeMockRequest({
      user: 'octocat',
      refresh: 'true',
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(refreshRateLimiter.checkLimit).toHaveBeenCalled();
    expect(refreshPolicy.isRefreshAllowed).toHaveBeenCalledWith('octocat');
    expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
      bypassCache: true,
    });
  });
  it('Test Case 2: normal request does not invoke refresh services', async () => {
    const req = makeMockRequest({
      user: 'octocat',
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(refreshRateLimiter.checkLimit).not.toHaveBeenCalled();
    expect(refreshPolicy.isRefreshAllowed).not.toHaveBeenCalled();
    expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
      bypassCache: false,
    });
  });
  it('Test Case 3: refresh falls back to cached data when refresh policy blocks', async () => {
    vi.mocked(refreshPolicy.isRefreshAllowed).mockReturnValue(false);

    const req = makeMockRequest({
      user: 'octocat',
      refresh: 'true',
    });

    await GET(req);

    expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
      bypassCache: false,
    });
  });
  it('Test Case 4: returns rate limit SVG when limiter blocks refresh', async () => {
    vi.mocked(refreshRateLimiter.checkLimit).mockReturnValue({
      success: false,
      limit: 3,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = makeMockRequest({
      user: 'octocat',
      refresh: 'true',
    });

    const res = await GET(req);

    expect(res.status).toBe(429);
  });
  it('Test Case 5: successful refresh records cache update', async () => {
    const req = makeMockRequest({
      user: 'octocat',
      refresh: 'true',
    });

    const res = await GET(req);

    expect(res.status).toBe(200);

    expect(getWrappedData).toHaveBeenCalledWith('octocat', expect.any(String), {
      bypassCache: true,
    });
  });
});
