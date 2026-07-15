import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted objects are created before vi.mock() factories run.
const mocks = vi.hoisted(() => ({
  limiter: {
    check: vi.fn(),
  },
}));

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

vi.mock('@/utils/getClientIp', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: class {
    check = mocks.limiter.check;

    constructor(_limit?: number, _window?: number, _maxSize?: number) {}
  },
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';

const mockedDashboard = vi.mocked(getFullDashboardData);
const mockedToken = vi.mocked(getUserGitHubToken);

describe('compare route - error resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.limiter.check.mockResolvedValue(true);

    mockedToken.mockResolvedValue(undefined);

    mockedDashboard.mockResolvedValue({} as never);
  });

  it('returns 500 when token retrieval throws', async () => {
    mockedToken.mockRejectedValue(new Error('Token service unavailable'));

    const res = await GET(new Request('http://localhost/api/compare?user1=octocat&user2=torvalds'));

    expect(res.status).toBe(500);

    expect(await res.json()).toEqual({
      error: 'Token service unavailable',
    });
  });

  it('returns 502 when first dashboard request fails', async () => {
    mockedDashboard
      .mockRejectedValueOnce(new Error('database exploded'))
      .mockResolvedValueOnce({} as never);

    const res = await GET(new Request('http://localhost/api/compare?user1=octocat&user2=torvalds'));

    expect(res.status).toBe(502);

    const body = await res.json();

    expect(body.error).toContain('Unable to fetch GitHub data for "octocat"');
  });

  it('returns 403 when GitHub rate limit error occurs', async () => {
    mockedDashboard
      .mockRejectedValueOnce(new Error('GitHub API rate limit reached'))
      .mockResolvedValueOnce({} as never);

    const res = await GET(new Request('http://localhost/api/compare?user1=octocat&user2=torvalds'));

    expect(res.status).toBe(403);

    expect(await res.json()).toEqual({
      error: 'GitHub API rate limit reached. Please try again later.',
    });
  });

  it('returns 429 when local rate limiter blocks', async () => {
    mocks.limiter.check.mockResolvedValue(false);

    const res = await GET(new Request('http://localhost/api/compare?user1=octocat&user2=torvalds'));

    expect(res.status).toBe(429);

    expect(await res.json()).toEqual({
      error: 'Too many requests. Please try again later.',
    });
  });

  it('returns 400 when validation fails', async () => {
    const res = await GET(new Request('http://localhost/api/compare?user1=octocat&user2=octocat'));

    expect(res.status).toBe(400);

    const body = await res.json();

    expect(body.error).toBe('Invalid parameters');
    expect(body.details).toBeDefined();
  });
});
