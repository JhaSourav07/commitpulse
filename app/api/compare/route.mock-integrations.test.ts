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
    .catch(err => console.error(err))