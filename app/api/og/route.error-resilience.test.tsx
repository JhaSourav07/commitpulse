import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

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

import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { logger } from '@/lib/logger';

describe('OG Route Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({} as never);

    vi.mocked(calculateStreak).mockReturnValue({
      totalContributions: 100,
      longestStreak: 10,
      currentStreak: 5,
      todayDate: '2026-07-18',
    });
  });

  it('returns a valid image response when GitHub contribution fetching throws an exception', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(
      new Error('Unexpected GitHub service failure')
    );

    const request = new NextRequest('http://localhost:3000/api/og?user=testuser');

    const response = await GET(request);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it('logs the exception when contribution fetching fails', async () => {
    const error = new Error('Database connectivity failure');

    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(error);

    const request = new NextRequest('http://localhost:3000/api/og?user=testuser');

    await GET(request);

    expect(logger.error).toHaveBeenCalledWith(
      'Stats fetch failed',
      expect.objectContaining({
        source: 'OG',
        error,
      })
    );
  });

  it('uses fallback values when contribution fetching fails instead of crashing', async () => {
    vi.mocked(fetchGitHubContributions).mockRejectedValueOnce(new Error('Service unavailable'));

    const request = new NextRequest('http://localhost:3000/api/og?user=testuser');

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(calculateStreak).not.toHaveBeenCalled();
  });

  it('recovers from malformed contribution data when streak calculation throws', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValueOnce({
      calendar: {},
    } as never);

    vi.mocked(calculateStreak).mockImplementationOnce(() => {
      throw new Error('Invalid contribution data');
    });

    const request = new NextRequest('http://localhost:3000/api/og?user=testuser');

    const response = await GET(request);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(logger.error).toHaveBeenCalled();
  });

  it('continues serving subsequent requests after an earlier request fails', async () => {
    vi.mocked(fetchGitHubContributions)
      .mockRejectedValueOnce(new Error('Temporary GitHub failure'))
      .mockResolvedValueOnce({} as never);

    const failedRequest = new NextRequest('http://localhost:3000/api/og?user=failinguser');

    const recoveredRequest = new NextRequest('http://localhost:3000/api/og?user=recovereduser');

    const firstResponse = await GET(failedRequest);
    const secondResponse = await GET(recoveredRequest);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(fetchGitHubContributions).toHaveBeenCalledTimes(2);
  });
});
