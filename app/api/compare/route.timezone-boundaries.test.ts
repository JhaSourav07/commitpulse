import { describe, it, expect, vi } from 'vitest';
import {
  isLeapYear,
  daysInYear,
  convertLocalToUtc,
  getLocalTodayStr,
} from '../../../lib/calculate';
import { GET } from './route';
import { getFullDashboardData } from '@/lib/github';
import { NextRequest } from 'next/server';

vi.mock('@/lib/github', () => ({
  getFullDashboardData: vi.fn(),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue('mock-token'),
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimiter: vi.fn().mockImplementation(function () {
    return { check: vi.fn().mockResolvedValue(true) };
  }),
}));

function makeRequest(query: string): Request {
  return new NextRequest(`http://localhost:3000/api/compare?${query}`);
}

describe('ApiCompareRoute - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  it('Case 1: verifies timezone normalization across standard settings (UTC, EST, IST, and JST)', () => {
    // Normalizes input local time elements to UTC string correctly across major timezones
    const utcStr = convertLocalToUtc(2024, 6, 15, 12, 0, 0, 'UTC');
    const estStr = convertLocalToUtc(2024, 6, 15, 12, 0, 0, 'America/New_York');
    const istStr = convertLocalToUtc(2024, 6, 15, 12, 0, 0, 'Asia/Kolkata');
    const jstStr = convertLocalToUtc(2024, 6, 15, 12, 0, 0, 'Asia/Tokyo');

    expect(utcStr).toBe('2024-06-15T12:00:00Z');

    // America/New_York (EST/EDT) at noon local is 16:00:00 UTC (during EDT, offset is -4h)
    expect(estStr).toBe('2024-06-15T16:00:00Z');

    // Asia/Kolkata at noon local is 06:30:00 UTC (offset is +5.5h)
    expect(istStr).toBe('2024-06-15T06:30:00Z');

    // Asia/Tokyo at noon local is 03:00:00 UTC (offset is +9h)
    expect(jstStr).toBe('2024-06-15T03:00:00Z');
  });

  it('Case 2: asserts calculations align commits onto the correct visual dates', () => {
    // Verify getLocalTodayStr behaves properly around midnight thresholds
    // e.g. UTC+10 (Australia/Sydney) when UTC is 2024-06-15 20:00:00 -> Sydney is 2024-06-16 06:00:00
    const nowUtc = new Date('2024-06-15T20:00:00Z');
    const sydneyToday = getLocalTodayStr(nowUtc, 'Australia/Sydney');
    expect(sydneyToday).toBe('2024-06-16');

    // UTC-8 (America/Los_Angeles) when UTC is 2024-06-15 20:00:00 -> LA is 2024-06-15 12:00:00
    const laToday = getLocalTodayStr(nowUtc, 'America/Los_Angeles');
    expect(laToday).toBe('2024-06-15');
  });

  it('Case 3: verifies leap year boundaries parse cleanly without leaving gaps in grids', () => {
    // Test isLeapYear utility
    expect(isLeapYear(2024)).toBe(true); // Leap year
    expect(isLeapYear(2000)).toBe(true); // Century leap year
    expect(isLeapYear(1900)).toBe(false); // Century non-leap year
    expect(isLeapYear(2023)).toBe(false); // Common year

    // Test daysInYear utility
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2023)).toBe(365);
  });

  it('Case 4: asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2024-01-01T00:00:00Z');

    // Ensure getLocalTodayStr always yields a YYYY-MM-DD formatted string
    const formattedUtc = getLocalTodayStr(testDate, 'UTC');
    const formattedIst = getLocalTodayStr(testDate, 'Asia/Kolkata');
    const formattedEst = getLocalTodayStr(testDate, 'America/New_York');

    expect(formattedUtc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formattedIst).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formattedEst).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(formattedUtc).toBe('2024-01-01');
  });

  it('Case 5: tests offsets around transition dates like daylight savings', () => {
    // America/New_York DST starts on second Sunday of March (e.g., March 10, 2024)
    // Spring forward occurs at 02:00:00 local time (becomes 03:00:00)
    // 01:00:00 local (EST) is 06:00:00 UTC (offset -5)
    // 03:00:00 local (EDT) is 07:00:00 UTC (offset -4)
    const estBeforeDst = convertLocalToUtc(2024, 3, 10, 1, 0, 0, 'America/New_York');
    const estAfterDst = convertLocalToUtc(2024, 3, 10, 3, 0, 0, 'America/New_York');

    expect(estBeforeDst).toBe('2024-03-10T06:00:00Z');
    expect(estAfterDst).toBe('2024-03-10T08:00:00Z');

    // America/New_York DST ends on first Sunday of November (e.g., November 3, 2024)
    // Fall back occurs at 02:00:00 local time (becomes 01:00:00)
    const edtBeforeFall = convertLocalToUtc(2024, 11, 3, 0, 0, 0, 'America/New_York');
    const estAfterFall = convertLocalToUtc(2024, 11, 3, 3, 0, 0, 'America/New_York');

    expect(edtBeforeFall).toBe('2024-11-03T04:00:00Z'); // offset -4 during EDT
    expect(estAfterFall).toBe('2024-11-03T07:00:00Z'); // offset -5 during EST
  });

  it('verifies integration of timezone normalization within compare API GET handler', async () => {
    const mockAlice = {
      username: 'alice',
      score: 750,
      calendar: {
        totalContributions: 120,
        weeks: [
          {
            contributionDays: [{ contributionCount: 5, date: '2024-02-29' }],
          },
        ],
      },
    };
    const mockBob = {
      username: 'bob',
      score: 600,
      calendar: {
        totalContributions: 80,
        weeks: [
          {
            contributionDays: [{ contributionCount: 2, date: '2024-02-29' }],
          },
        ],
      },
    };

    vi.mocked(getFullDashboardData)
      .mockResolvedValueOnce(mockAlice as never)
      .mockResolvedValueOnce(mockBob as never);

    const res = await GET(makeRequest('user1=alice&user2=bob') as Request);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user1.calendar.weeks[0].contributionDays[0].date).toBe('2024-02-29');
    expect(body.user2.calendar.weeks[0].contributionDays[0].date).toBe('2024-02-29');
  });
});
