import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn(),
}));

import { fetchPRInsights } from '@/services/github/pr-insights';
import { getUserGitHubToken } from '@/lib/githubtoken';

const mockInsights = {
  totalPRs: 2,
  openPRs: 1,
  mergedPRs: 1,
  closedPRs: 0,
  mergeRate: 50,
  avgReviewTime: 2,
  avgTimeToFirstReview: 1,
  avgCycleTime: 24,
  weeklyActivity: [{ name: '2026-W01', prs: 2 }],
  monthlyActivity: [{ name: '2026-01', prs: 2 }],
  reviewsGiven: 1,
  reviewsReceived: 1,
  avgReviewResponseTime: 2,
  fastestReview: 1,
  slowestReview: 3,
  repoPerformance: [],
  highlights: {},
  prs: [],
  sizeDistribution: {
    atomic: 1,
    standard: 1,
    massive: 0,
  },
};

describe('PR Insights Route Timezone Boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserGitHubToken).mockResolvedValue(undefined);
    vi.mocked(fetchPRInsights).mockResolvedValue(mockInsights);
  });

  it('returns consistent PR insight data for a UTC calendar boundary', async () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const request = new Request('http://localhost:3000/api/pr-insights?username=testuser');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeklyActivity).toEqual([{ name: '2026-W01', prs: 2 }]);
    expect(data.monthlyActivity).toEqual([{ name: '2026-01', prs: 2 }]);
  });

  it('preserves calendar data across a negative timezone offset boundary', async () => {
    vi.setSystemTime(new Date('2026-01-01T05:00:00.000Z'));

    const request = new Request('http://localhost:3000/api/pr-insights?username=testuser');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.monthlyActivity[0].name).toBe('2026-01');
  });

  it('preserves calendar data across positive IST and JST-style timezone offsets', async () => {
    vi.setSystemTime(new Date('2026-01-31T18:30:00.000Z'));

    const request = new Request('http://localhost:3000/api/pr-insights?username=testuser');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeklyActivity).toEqual(mockInsights.weeklyActivity);
    expect(data.monthlyActivity).toEqual(mockInsights.monthlyActivity);
  });

  it('handles leap-year calendar boundary data without gaps', async () => {
    vi.setSystemTime(new Date('2024-02-29T23:59:59.000Z'));

    const request = new Request('http://localhost:3000/api/pr-insights?username=testuser');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeklyActivity).toHaveLength(1);
    expect(data.monthlyActivity).toHaveLength(1);
  });

  it('keeps activity data stable around daylight-saving transition dates', async () => {
    vi.setSystemTime(new Date('2026-03-08T07:00:00.000Z'));

    const request = new Request('http://localhost:3000/api/pr-insights?username=testuser');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weeklyActivity).toEqual(mockInsights.weeklyActivity);
    expect(data.monthlyActivity).toEqual(mockInsights.monthlyActivity);
    expect(fetchPRInsights).toHaveBeenCalledWith('testuser', undefined, expect.any(AbortSignal));
  });
});
