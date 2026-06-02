import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { calculateWrappedStats } from '../../../../lib/calculate';

vi.mock('../../../../lib/github', () => ({
  getWrappedData: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

import { getWrappedData, fetchGitHubContributions } from '../../../../lib/github';
import type { ContributionCalendar } from '../../../../types';
import type { WrappedStats } from '../../../../types/dashboard';

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/wrapped');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return new Request(url.toString());
}

function makeCalendar(days: { date: string; contributionCount: number }[]): ContributionCalendar {
  return {
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    weeks: [
      {
        contributionDays: days,
      },
    ],
  };
}

describe('GET /api/wrapped stats calculation', () => {
  const statsCalendar = makeCalendar([
    { date: '2025-01-04', contributionCount: 10 },
    { date: '2025-01-05', contributionCount: 10 },
    { date: '2025-02-03', contributionCount: 7 },
    { date: '2025-02-04', contributionCount: 8 },
    { date: '2025-02-05', contributionCount: 9 },
    { date: '2025-03-08', contributionCount: 30 },
  ]);

  beforeEach(() => {
    vi.clearAllMocks();

    const wrappedStats: WrappedStats = {
      ...calculateWrappedStats(statsCalendar),
      topLanguage: 'TypeScript',
    };

    vi.mocked(getWrappedData).mockResolvedValue(wrappedStats);
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: statsCalendar,
    } as unknown as import('../../../../types').ExtendedContributionData);
  });

  it('renders the calculated busiest month in the wrapped SVG', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2025' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('MARCH');
  });

  it('renders the calculated weekend contribution ratio', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2025' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('68%');
  });

  it('renders the peak contribution day count and date', async () => {
    const response = await GET(makeRequest({ user: 'octocat', year: '2025' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('30 COMMITS');
    expect(body).toContain('ON MAR 8');
  });

  it('requests wrapped stats and contribution data using selected year bounds', async () => {
    await GET(makeRequest({ user: 'octocat', year: '2025' }));

    expect(getWrappedData).toHaveBeenCalledWith('octocat', '2025', {
      bypassCache: false,
    });

    expect(fetchGitHubContributions).toHaveBeenCalledWith('octocat', {
      from: '2025-01-01T00:00:00Z',
      to: '2025-12-31T23:59:59Z',
      bypassCache: false,
    });
  });

  it('returns 400 and skips wrapped stats calculation when validation fails', async () => {
    const response = await GET(makeRequest({ user: 'invalid_user', year: '2025' }));

    expect(response.status).toBe(400);
    expect(getWrappedData).not.toHaveBeenCalled();
    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });
});
