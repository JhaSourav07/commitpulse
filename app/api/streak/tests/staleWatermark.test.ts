import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { hasStaleWatermark } from '@/lib/svg/staleWatermark';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('@/utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(() => 3600),
  getSecondsUntilMidnightInTimezone: vi.fn(() => 7200),
}));

import { fetchGitHubContributions, getOrgDashboardData } from '@/lib/github';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type { ContributionCalendar, ExtendedContributionData } from '@/types';

const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-06-10' },
        { contributionCount: 2, date: '2024-06-11' },
        { contributionCount: 0, date: '2024-06-12' },
        { contributionCount: 3, date: '2024-06-13' },
        { contributionCount: 1, date: '2024-06-14' },
        { contributionCount: 0, date: '2024-06-15' },
        { contributionCount: 3, date: '2024-06-16' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost:3000/api/streak');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return new NextRequest(url.toString());
}

describe('GET /api/streak stale watermark', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getOrgDashboardData).mockResolvedValue({
      profile: {
        username: 'octocat',
        name: 'The Octocat',
        avatarUrl: 'https://github.com/octocat.png',
        isPro: false,
        bio: 'Testing organization mock pipelines',
        location: 'San Francisco, CA',
        joinedDate: '2011-01-25',
        developerScore: 85,
        stats: { repositories: 10, followers: 2500, following: 9, stars: 450 },
      },
      stats: {
        totalCommits: 10,
        totalIssues: 2,
        totalPRs: 5,
        totalReviews: 1,
        totalDiscussions: 0,
        contributedTo: 3,
      },
      calendar: mockCalendar,
    } as unknown as Awaited<ReturnType<typeof getOrgDashboardData>>);

    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  it('adds the stale watermark when the fetcher returns offline fallback data', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: true,
    } as unknown as ExtendedContributionData);

    const response = await GET(makeRequest({ user: 'octocat' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(hasStaleWatermark(body)).toBe(true);
    expect(body).toContain('commitpulse-stale-badge');
  });

  it('does not add the stale watermark for a live fetch', async () => {
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);

    const response = await GET(makeRequest({ user: 'octocat' }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(hasStaleWatermark(body)).toBe(false);
    expect(body).not.toContain('commitpulse-stale-badge');
  });
});
