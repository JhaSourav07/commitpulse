import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/og', () => {
  class MockImageResponse extends Response {
    constructor(_element: unknown, options?: ResponseInit & { headers?: HeadersInit }) {
      super(null, {
        status: 200,
        headers: options?.headers,
      });
    }
  }

  return {
    ImageResponse: MockImageResponse,
  };
});
vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
}));

vi.mock('@/lib/calculate', () => ({
  calculateStreak: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

import { GET } from './route';
import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const makeRequest = (query = 'user=octocat') =>
  new NextRequest(`http://localhost:3000/api/og?${query}`);

describe('GET /api/og - Mock Integrations & Async Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValue({
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 60_000,
    });

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: {},
    } as never);

    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 125,
      longestStreak: 18,
      currentStreak: 6,
    } as never);
  });
  it('returns an OG image using the mocked GitHub service', async () => {
    const response = await GET(makeRequest());

    expect(fetchGitHubContributions).toHaveBeenCalledTimes(1);
    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      bypassCache: false,
    });

    expect(calculateStreak).toHaveBeenCalledTimes(1);

    expect(response).toBeInstanceOf(Response);
  });

  it('forwards bypassCache=true when refresh=true is supplied', async () => {
    await GET(makeRequest('user=octocat&refresh=true'));

    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      bypassCache: true,
    });

    expect(calculateStreak).toHaveBeenCalledTimes(1);
  });
  it('uses bypassCache=true when bypassCache=true is supplied', async () => {
    await GET(makeRequest('user=octocat&bypassCache=true'));

    expect(fetchGitHubContributions).toHaveBeenCalledTimes(1);
    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      bypassCache: true,
    });
  });

  it('logs an error and still returns an OG image when GitHub retrieval fails', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(new Error('GitHub unavailable'));

    const response = await GET(makeRequest());

    expect(logger.error).toHaveBeenCalledWith(
      'Stats fetch failed',
      expect.objectContaining({
        source: 'OG',
        error: expect.any(Error),
      })
    );

    expect(response).toBeInstanceOf(Response);
  });
  it('returns 429 when the rate limiter rejects the request', async () => {
    vi.spyOn(RateLimiter.prototype, 'checkWithResult').mockResolvedValueOnce({
      success: false,
      limit: 30,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({
      error: 'Too many requests. Please try again later.',
    });

    expect(fetchGitHubContributions).not.toHaveBeenCalled();
    expect(calculateStreak).not.toHaveBeenCalled();
  });
});
