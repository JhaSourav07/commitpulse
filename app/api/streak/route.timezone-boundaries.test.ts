import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchGitHubContributions } from '@/lib/github';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type { ExtendedContributionData } from '@/types';

vi.mock('@/lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  getOrgDashboardData: vi.fn(),
  fetchCommitHourDistribution: vi.fn(() => Promise.resolve(new Array(24).fill(0))),
  isAbortError: vi.fn(() => false),
}));

vi.mock('@/utils/time', () => ({
  getSecondsUntilUTCMidnight: vi.fn(() => 3600),
  getSecondsUntilMidnightInTimezone: vi.fn(() => 7200),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/streak');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url.toString());
}

const leapYearCalendar = {
  totalContributions: 6,
  weeks: [
    {
      contributionDays: [
        {
          contributionCount: 2,
          date: '2024-02-28',
        },
        {
          contributionCount: 3,
          date: '2024-02-29',
        },
        {
          contributionCount: 1,
          date: '2024-03-01',
        },
      ],
    },
  ],
};

describe('ApiStreakRoute Timezone Normalization & Calendar Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: leapYearCalendar,
      repoContributions: [],
      isOfflineFallback: false,
    } as unknown as ExtendedContributionData);

    vi.mocked(getSecondsUntilUTCMidnight).mockReturnValue(3600);
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(7200);
  });

  it('accepts UTC timezone and returns a valid SVG', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        tz: 'UTC',
      })
    );

    expect(response.status).toBe(200);

    const svg = await response.text();

    expect(svg).toContain('<svg');
    expect(fetchGitHubContributions).toHaveBeenCalledTimes(1);
  });

  it('accepts Asia/Kolkata timezone and uses timezone-aware cache calculation', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        tz: 'Asia/Kolkata',
      })
    );

    expect(response.status).toBe(200);

    expect(getSecondsUntilMidnightInTimezone).toHaveBeenCalled();
    expect(getSecondsUntilUTCMidnight).not.toHaveBeenCalled();

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=7200');
  });

  it('returns 400 for an invalid timezone and skips GitHub fetching', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        tz: 'Invalid/Timezone',
      })
    );

    expect(response.status).toBe(400);

    const body = await response.text();

    expect(body).toContain('<svg');
    expect(body).toContain('Invalid timezone');

    expect(fetchGitHubContributions).not.toHaveBeenCalled();
  });

  it('uses timezone cache duration in JSON responses', async () => {
    vi.mocked(getSecondsUntilMidnightInTimezone).mockReturnValue(1234);

    const response = await GET(
      makeRequest({
        user: 'octocat',
        tz: 'Asia/Tokyo',
        format: 'json',
      })
    );

    expect(response.status).toBe(200);

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=1234');

    const body = await response.json();

    expect(body.user).toBe('octocat');
  });

  it('preserves leap-year boundary dates across timezone-aware JSON responses', async () => {
    const response = await GET(
      makeRequest({
        user: 'octocat',
        tz: 'Asia/Kolkata',
        format: 'json',
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    const dates = body.calendar.weeks.flatMap((week: { contributionDays: { date: string }[] }) =>
      week.contributionDays.map((day) => day.date)
    );

    expect(dates).toContain('2024-02-28');
    expect(dates).toContain('2024-02-29');
    expect(dates).toContain('2024-03-01');
  });
});
