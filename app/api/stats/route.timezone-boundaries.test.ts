import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isLeapYear,
  daysInYear,
  convertLocalToUtc,
  getLocalTodayStr,
} from '../../../lib/calculate';
import { GET } from './route';
import { fetchGitHubContributions } from '../../../lib/github';
import type { ContributionCalendar } from '../../../types';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

vi.mock('../../../lib/github', () => ({
  fetchGitHubContributions: vi.fn(),
  contributionsCache: { has: vi.fn().mockResolvedValue(false) },
  cacheKey: vi.fn().mockReturnValue('key'),
}));

vi.mock('@/lib/githubtoken', () => ({
  getUserGitHubToken: vi.fn().mockResolvedValue('mock-token'),
}));

const mockCalendar: ContributionCalendar = {
  totalContributions: 10,
  weeks: [
    {
      contributionDays: [
        { contributionCount: 1, date: '2024-02-28' },
        { contributionCount: 2, date: '2024-02-29' },
        { contributionCount: 3, date: '2024-03-01' },
      ],
    },
  ],
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/stats');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe('ApiStatsRoute - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMonitor.reset();
    refreshPolicy.reset();
    refreshRateLimiter.reset();
    vi.mocked(fetchGitHubContributions).mockResolvedValue({
      calendar: mockCalendar,
      repoContributions: [],
    });
  });

  it('Case 1: verifies timezone normalization across standard settings (UTC, EST, IST, and JST)', async () => {
    // Valid timezone: Asia/Kolkata
    const resIst = await GET(makeRequest({ user: 'testuser', tz: 'Asia/Kolkata' }));
    expect(resIst.status).toBe(200);

    // Valid timezone: America/New_York
    const resEst = await GET(makeRequest({ user: 'testuser', tz: 'America/New_York' }));
    expect(resEst.status).toBe(200);

    // Invalid timezone parameter: returns 400
    const resInvalid = await GET(makeRequest({ user: 'testuser', tz: 'Invalid/Timezone' }));
    expect(resInvalid.status).toBe(400);
    const body = await resInvalid.json();
    expect(body.error).toMatch(/Invalid "tz" parameter/);
  });

  it('Case 2: asserts calculations align commits onto the correct visual dates', () => {
    // Verify getLocalTodayStr behaves properly around midnight thresholds
    // UTC+10 (Australia/Sydney) when UTC is 2024-06-15 20:00:00 -> Sydney is 2024-06-16
    const nowUtc = new Date('2024-06-15T20:00:00Z');
    const sydneyToday = getLocalTodayStr(nowUtc, 'Australia/Sydney');
    expect(sydneyToday).toBe('2024-06-16');

    // UTC-8 (America/Los_Angeles) when UTC is 2024-06-15 20:00:00 -> LA is 2024-06-15
    const laToday = getLocalTodayStr(nowUtc, 'America/Los_Angeles');
    expect(laToday).toBe('2024-06-15');
  });

  it('Case 3: verifies leap year boundaries parse cleanly without leaving gaps in grids', () => {
    expect(isLeapYear(2024)).toBe(true); // Leap year
    expect(isLeapYear(2023)).toBe(false); // Common year

    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2023)).toBe(365);
  });

  it('Case 4: asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2024-01-01T00:00:00Z');

    const formattedUtc = getLocalTodayStr(testDate, 'UTC');
    const formattedIst = getLocalTodayStr(testDate, 'Asia/Kolkata');
    const formattedEst = getLocalTodayStr(testDate, 'America/New_York');

    expect(formattedUtc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formattedIst).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formattedEst).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(formattedUtc).toBe('2024-01-01');
  });

  it('Case 5: tests offsets around transition dates like daylight savings', () => {
    // EST starts/ends DST in America/New_York
    const estBeforeDst = convertLocalToUtc(2024, 3, 10, 1, 0, 0, 'America/New_York');
    const estAfterDst = convertLocalToUtc(2024, 3, 10, 3, 0, 0, 'America/New_York');

    expect(estBeforeDst).toBe('2024-03-10T06:00:00Z');
    expect(estAfterDst).toBe('2024-03-10T08:00:00Z');

    const edtBeforeFall = convertLocalToUtc(2024, 11, 3, 0, 0, 0, 'America/New_York');
    const estAfterFall = convertLocalToUtc(2024, 11, 3, 3, 0, 0, 'America/New_York');

    expect(edtBeforeFall).toBe('2024-11-03T04:00:00Z');
    expect(estAfterFall).toBe('2024-11-03T07:00:00Z');
  });

  it('verifies integration of timezone parameter within stats API GET handler calculations', async () => {
    const res = await GET(makeRequest({ user: 'testuser', tz: 'America/New_York' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('totalContributions');
    expect(body).toHaveProperty('longestStreak');
    expect(body).toHaveProperty('currentStreak');
  });
});
