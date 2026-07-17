import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/services/github/pr-insights', () => ({
  fetchPRInsights: vi.fn(),
}));

import { fetchPRInsights } from '@/services/github/pr-insights';
import type { PRInsightData } from '@/services/github/pr-insights';

const mockInsights: PRInsightData = {
  totalPRs: 20,
  openPRs: 5,
  mergedPRs: 12,
  closedPRs: 3,
  mergeRate: 60,
  avgReviewTime: 5,
  avgTimeToFirstReview: 2,
  avgCycleTime: 24,
  weeklyActivity: [{ name: '2024-W01', prs: 3 }],
  monthlyActivity: [{ name: '2024-01', prs: 8 }],
  reviewsGiven: 7,
  reviewsReceived: 9,
  avgReviewResponseTime: 5,
  fastestReview: 1,
  slowestReview: 48,
  repoPerformance: [
    { name: 'org/repo', totalPRs: 10, mergeRate: 70, reviewCount: 4, avgReviewTime: 6 },
  ],
  prs: [],
  highlights: {
    mostDiscussed: { title: 'Big PR', url: 'https://github.com/org/repo/pull/1', comments: 12 },
    fastestMerged: { title: 'Quick fix', url: 'https://github.com/org/repo/pull/2', time: 0.5 },
    largest: {
      title: 'Refactor',
      url: 'https://github.com/org/repo/pull/3',
      additions: 500,
      deletions: 100,
    },
  },
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/pr-insights');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('GET /api/pr-insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchPRInsights).mockResolvedValue(mockInsights);
  });

  it('returns 400 when the username parameter is missing', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Username is required');
    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('returns 400 when the username exceeds the 39 character GitHub limit', async () => {
    const longUsername = 'a'.repeat(40);
    const response = await GET(makeRequest({ username: longUsername }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid GitHub username');
    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('returns 400 for a username containing invalid characters', async () => {
    const response = await GET(makeRequest({ username: 'invalid_user!' }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid GitHub username');
    expect(fetchPRInsights).not.toHaveBeenCalled();
  });

  it('trims whitespace from the username before validation and fetching', async () => {
    const response = await GET(makeRequest({ username: '  octocat  ' }));

    expect(response.status).toBe(200);
    expect(fetchPRInsights).toHaveBeenCalledWith('octocat', undefined, expect.any(AbortSignal));
  });

  it('returns the full PR insights payload on a successful fetch', async () => {
    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockInsights);
    expect(fetchPRInsights).toHaveBeenCalledWith('octocat', undefined, expect.any(AbortSignal));
  });

  it('returns 500 with the error message when fetchPRInsights throws an Error', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue(new Error('GitHub API error'));

    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('GitHub API error');
  });

  it('returns 500 with a generic message when fetchPRInsights throws a non-Error value', async () => {
    vi.mocked(fetchPRInsights).mockRejectedValue('unexpected failure');

    const response = await GET(makeRequest({ username: 'octocat' }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to fetch PR insights');
  });
});
