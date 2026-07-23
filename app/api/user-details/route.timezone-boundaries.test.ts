import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { fetchUserProfile, fetchGitHubContributions } from '@/lib/github';
import { getLocalTodayStr, convertLocalToUtc, isLeapYear, daysInYear } from '@/lib/calculate';
import type { ContributionCalendar } from '@/types';

vi.mock('@/lib/github', () => ({
  fetchUserProfile: vi.fn(),
  fetchGitHubContributions: vi.fn(),
}));

const mockProfile = {
  login: 'timezoneuser',
  name: 'Timezone User',
  avatar_url: 'https://github.com/timezoneuser.png',
  public_repos: 5,
};

function makeRequest(username: string): Request {
  return new Request(`http://localhost/api/user-details?username=${username}`);
}

describe('ApiUser-detailsRoute-timezone-boundaries: Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fetchUserProfile).mockResolvedValue(mockProfile as any);
  });

  it('1. Mock standard timezone settings (e.g., UTC, EST, IST, and JST)', async () => {
    // UTC Time: 2024-01-15T00:00:00Z
    const now = new Date(Date.UTC(2024, 0, 15, 0, 0, 0));

    expect(getLocalTodayStr(now, 'UTC')).toBe('2024-01-15');
    expect(getLocalTodayStr(now, 'Asia/Kolkata')).toBe('2024-01-15'); // IST
    expect(getLocalTodayStr(now, 'Asia/Tokyo')).toBe('2024-01-15'); // JST
    expect(getLocalTodayStr(now, 'America/New_York')).toBe('2024-01-14'); // EST
  });

  it('2. Assert calculations align commits onto the correct visual dates', async () => {
    const calendar: ContributionCalendar = {
      totalContributions: 2,
      weeks: [
        {
          contributionDays: [
            { date: '2024-01-14', contributionCount: 1 },
            { date: '2024-01-15', contributionCount: 1 },
          ],
        },
      ],
    };

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar,
      repoContributions: [],
      totalPRs: 0,
      totalIssues: 0,
    });

    const response = await GET(makeRequest('timezoneuser'));
    expect(response.status).toBe(200);
    const body = await response.json();

    // Total contributions and streak assertions
    expect(body.stats.totalContributions).toBe(2);
    // Since 2024-01-14 and 2024-01-15 are consecutive days, streak calculation should be correct
    expect(body.stats.longestStreak).toBeGreaterThanOrEqual(2);
  });

  it('3. Verify leap year boundaries parse without leaving gaps in grids', async () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(daysInYear(2024)).toBe(366);
    expect(isLeapYear(2023)).toBe(false);
    expect(daysInYear(2023)).toBe(365);

    const calendar: ContributionCalendar = {
      totalContributions: 3,
      weeks: [
        {
          contributionDays: [
            { date: '2024-02-28', contributionCount: 1 },
            { date: '2024-02-29', contributionCount: 1 },
            { date: '2024-03-01', contributionCount: 1 },
          ],
        },
      ],
    };

    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar,
      repoContributions: [],
      totalPRs: 0,
      totalIssues: 0,
    });

    const response = await GET(makeRequest('timezoneuser'));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.stats.totalContributions).toBe(3);
    // Leap year boundary (Feb 28 -> Feb 29 -> Mar 1) should be continuous, yielding a streak of 3
    expect(body.stats.longestStreak).toBe(3);
  });

  it('4. Assert calendar date format utility outputs match expectations in each locale', async () => {
    // America/New_York (EDT, UTC-4) -> UTC is 19:30:00
    const nyUtc = convertLocalToUtc(2024, 5, 10, 15, 30, 0, 'America/New_York');
    expect(nyUtc).toBe('2024-05-10T19:30:00Z');

    // Asia/Tokyo (JST, UTC+9) -> UTC is 06:30:00
    const tkUtc = convertLocalToUtc(2024, 5, 10, 15, 30, 0, 'Asia/Tokyo');
    expect(tkUtc).toBe('2024-05-10T06:30:00Z');

    // Asia/Kolkata (IST, UTC+5:30) -> UTC is 10:00:00
    const inUtc = convertLocalToUtc(2024, 5, 10, 15, 30, 0, 'Asia/Kolkata');
    expect(inUtc).toBe('2024-05-10T10:00:00Z');
  });

  it('5. Test offsets around transition dates like daylight savings', async () => {
    // Pre DST: 2024-03-09 12:00:00 Local -> 17:00:00 UTC (EST, UTC-5)
    const preDST = convertLocalToUtc(2024, 3, 9, 12, 0, 0, 'America/New_York');
    expect(preDST).toBe('2024-03-09T17:00:00Z');

    // Post DST: 2024-03-11 12:00:00 Local -> 16:00:00 UTC (EDT, UTC-4)
    const postDST = convertLocalToUtc(2024, 3, 11, 12, 0, 0, 'America/New_York');
    expect(postDST).toBe('2024-03-11T16:00:00Z');

    const transitionDate = new Date(Date.UTC(2024, 2, 10, 6, 0, 0));
    expect(getLocalTodayStr(transitionDate, 'America/New_York')).toBe('2024-03-10');
  });
});
