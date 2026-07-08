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

// Same fixture as views.test.ts — weekday totals hand-verified below:
// Sun: 3, Mon: 1, Tue: 2, Wed: 0, Thu: 3, Fri: 1, Sat: 0 (total: 10)
// Sun and Thu tie at 3; groupByWeekday's reduce only updates on strictly-greater,
// so Sun (index 0, encountered first) remains the highlighted "peak day".
const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-06-10' }, // Mon
        { contributionCount: 2, date: '2024-06-11' }, // Tue
        { contributionCount: 0, date: '2024-06-12' }, // Wed
        { contributionCount: 3, date: '2024-06-13' }, // Thu
        { contributionCount: 1, date: '2024-06-14' }, // Fri
        { contributionCount: 0, date: '2024-06-15' }, // Sat
        { contributionCount: 3, date: '2024-06-16' }, // Sun
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

describe('GET /api/streak?view=weekday', () => {
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

  it('returns 200 and the standard SVG headers for view=weekday', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'weekday' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'none'");
  });

  it('renders all seven weekday labels', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'weekday' }));
    const body = await response.text();

    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(body).toContain(day);
    }
  });

  it('shows the total contributions count as a subtitle', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'weekday' }));
    const body = await response.text();

    expect(body).toContain('10 contributions');
  });

  it('parses view=weekday as a valid schema value (does not fall back to default)', async () => {
    const parsed = streakParamsSchema.safeParse({ user: 'octocat', view: 'weekday' });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.view).toBe('weekday');
  });

  it('exposes stable caching headers on the weekday SVG response', async () => {
    const response = await GET(makeRequest({ user: 'octocat', view: 'weekday' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=60'
    );
    expect(response.headers.get('X-Cache-Status')).toBe('HIT');
  });

  it('respects the tz parameter without crashing', async () => {
    const response = await GET(
      makeRequest({ user: 'octocat', view: 'weekday', tz: 'Asia/Kolkata' })
    );

    expect(response.status).toBe(200);
  });
});
