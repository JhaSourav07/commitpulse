import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { streakParamsSchema } from '@/lib/validations';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
}));

vi.mock('@/utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(),
  getSecondsUntilMidnightInTimezone: vi.fn(),
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
    {
      contributionDays: [
        { contributionCount: 0, date: '2024-06-17' },
        { contributionCount: 0, date: '2024-06-18' },
        { contributionCount: 0, date: '2024-06-19' },
        { contributionCount: 0, date: '2024-06-20' },
        { contributionCount: 0, date: '2024-06-21' },
        { contributionCount: 0, date: '2024-06-22' },
        { contributionCount: 0, date: '2024-06-23' },
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

describe('GET /api/streak view parameter integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    } as unknown as ExtendedContributionData);

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

  it('returns 200 and the standard SVG headers for view=default', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'default' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");

    const body = await response.text();
    expect(body).toContain('CURRENT_STREAK');
  });

  it('returns 200 and renders monthly dimensions for view=monthly', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'monthly' }));

    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('COMMITS THIS MONTH');
    expect(body).toContain('width="300"');
    expect(body).toContain('height="120"');
    expect(body).toContain('viewBox="0 0 300 120"');
  });

  it('falls back to the default layout when view is omitted', async () => {
    const parsed = streakParamsSchema.safeParse({ user: 'octocat' });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.view).toBe('default');

    const response = await GET(makeRequest({ user: 'octocat' }));

    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('CURRENT_STREAK');
    expect(body).not.toContain('COMMITS THIS MONTH');
  });

  it('treats an invalid view value as default without crashing', async () => {
    const parsed = streakParamsSchema.safeParse({ user: 'octocat', view: 'unknown_view' });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.view).toBe('default');

    const response = await GET(makeRequest({ user: 'octocat', view: 'unknown_view' }));

    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('CURRENT_STREAK');
    expect(body).not.toContain('COMMITS THIS MONTH');
  });

  it('returns 200 and renders radar map for view=radar', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'radar' }));

    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toContain('Contribution Radar');
  });

  it('exposes stable caching headers on the SVG response', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'default' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });
});
