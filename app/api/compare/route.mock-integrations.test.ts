import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    check = vi.fn().mockResolvedValue(true);
  },
}));

import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';

const makeRequest = () => new Request('http://localhost:3000/api/compare?user1=alice&user2=bob');

const dashboardData = {
  profile: {
    login: 'alice',
  },
  stats: {
    totalContributions: 100,
  },
};

describe('GET /api/compare mock integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getUserGitHubToken).mockResolvedValue('github-token');

    vi.mocked(getFullDashboardData).mockResolvedValue(dashboardData as never);
  });

  it('requests both users with the GitHub token', async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);

    expect(getUserGitHubToken).toHaveBeenCalledTimes(1);

    expect(getFullDashboardData).toHaveBeenCalledTimes(2);

    expect(getFullDashboardData).toHaveBeenNthCalledWith(1, 'alice', { token: 'github-token' });

    expect(getFullDashboardData).toHaveBeenNthCalledWith(2, 'bob', { token: 'github-token' });
  });

  it('waits for both async GitHub requests before responding', async () => {
    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    vi.mocked(getFullDashboardData)
      .mockReturnValueOnce(firstPromise as never)
      .mockReturnValueOnce(secondPromise as never);

    const responsePromise = GET(makeRequest());

    let settled = false;

    responsePromise.then(() => {
      settled = true;
    });

    await Promise.resolve();

    expect(settled).toBe(false);

    resolveFirst(dashboardData);
    await Promise.resolve();

    expect(settled).toBe(false);

    resolveSecond(dashboardData);

    const res = await responsePromise;

    expect(res.status).toBe(200);
  });

  it('returns fallback response when one GitHub request rejects', async () => {
    vi.mocked(getFullDashboardData)
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValueOnce(dashboardData as never);

    const res = await GET(makeRequest());

    expect(getFullDashboardData).toHaveBeenCalledTimes(2);

    expect(res.status).toBe(404);

    const body = await res.json();

    expect(body.error).toContain('alice');
  });

  it('uses the token returned by getUserGitHubToken for every service call', async () => {
    vi.mocked(getUserGitHubToken).mockResolvedValue('special-token');

    await GET(makeRequest());

    expect(getUserGitHubToken).toHaveBeenCalledOnce();

    expect(getFullDashboardData).toHaveBeenNthCalledWith(1, 'alice', { token: 'special-token' });

    expect(getFullDashboardData).toHaveBeenNthCalledWith(2, 'bob', { token: 'special-token' });
  });

  it('returns successful JSON after both mocked services resolve', async () => {
    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce({
        profile: { login: 'alice' },
      } as never)
      .mockResolvedValueOnce({
        profile: { login: 'bob' },
      } as never);

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);

    expect(getFullDashboardData).toHaveBeenCalledTimes(2);

    const body = await res.json();

    expect(body.user1.profile.login).toBe('alice');
    expect(body.user2.profile.login).toBe('bob');
  });
});
