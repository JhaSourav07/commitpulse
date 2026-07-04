import { describe, it, expect } from 'vitest';
import {
  getLocalTodayStr,
  convertLocalToUtc,
  isLeapYear,
  daysInYear,
  normalizeCalendarToTimezone,
} from './calculate';

describe('Timezone Normalization & Calendar Data Boundary Alignment', () => {
  it('1. Mock standard timezone settings (e.g., UTC, EST, IST, and JST)', () => {
    // UTC Time: 2024-01-15T00:00:00Z
    const now = new Date(Date.UTC(2024, 0, 15, 0, 0, 0));

    // UTC
    expect(getLocalTodayStr(now, 'UTC')).toBe('2024-01-15');

    // IST (UTC +5:30) -> 2024-01-15T05:30:00
    expect(getLocalTodayStr(now, 'Asia/Kolkata')).toBe('2024-01-15');

    // JST (UTC +9:00) -> 2024-01-15T09:00:00
    expect(getLocalTodayStr(now, 'Asia/Tokyo')).toBe('2024-01-15');

    // EST (UTC -5:00) -> 2024-01-14T19:00:00
    expect(getLocalTodayStr(now, 'America/New_York')).toBe('2024-01-14');
  });

  it('2. Assert calculations align commits onto the correct visual dates', () => {
    const calendar = {
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

    const normalized = normalizeCalendarToTimezone(calendar, 'UTC');

    expect(normalized.weeks.length).toBeGreaterThan(0);
    const allDays = normalized.weeks.flatMap((w) => w.contributionDays);
    expect(allDays.map((d) => d.date)).toEqual(['2024-01-14', '2024-01-15']);

    // Verify week boundary: 2024-01-14 is Sunday, 2024-01-15 is Monday
    // They should correctly be placed in the exact same week (Sunday-Saturday)
    expect(normalized.weeks[0].contributionDays.length).toBe(2);
  });

  it('3. Verify leap year boundaries parse without leaving gaps in grids', () => {
    // 2024 is a leap year
    expect(isLeapYear(2024)).toBe(true);
    expect(daysInYear(2024)).toBe(366);

    // 2023 is not a leap year
    expect(isLeapYear(2023)).toBe(false);
    expect(daysInYear(2023)).toBe(365);

    // Verify transitions across a leap year day
    const now1 = new Date(Date.UTC(2024, 1, 28, 12, 0, 0));
    expect(getLocalTodayStr(now1, 'UTC')).toBe('2024-02-28');

    const now2 = new Date(Date.UTC(2024, 1, 29, 12, 0, 0));
    expect(getLocalTodayStr(now2, 'UTC')).toBe('2024-02-29');

    const now3 = new Date(Date.UTC(2024, 2, 1, 12, 0, 0));
    expect(getLocalTodayStr(now3, 'UTC')).toBe('2024-03-01');
  });

  it('4. Assert calendar date format utility outputs match expectations in each locale', () => {
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

  it('5. Test offsets around transition dates like daylight savings', () => {
    // US DST starts on March 10, 2024 at 2:00 AM
    // Standard Time (EST, UTC-5): 2024-03-09 12:00:00 Local -> 17:00:00 UTC
    const preDST = convertLocalToUtc(2024, 3, 9, 12, 0, 0, 'America/New_York');
    expect(preDST).toBe('2024-03-09T17:00:00Z');

    // Daylight Savings (EDT, UTC-4): 2024-03-11 12:00:00 Local -> 16:00:00 UTC
    const postDST = convertLocalToUtc(2024, 3, 11, 12, 0, 0, 'America/New_York');
    expect(postDST).toBe('2024-03-11T16:00:00Z');

    // Testing getLocalTodayStr exactly during the day of DST transition
    const transitionDate = new Date(Date.UTC(2024, 2, 10, 6, 0, 0));
    expect(getLocalTodayStr(transitionDate, 'America/New_York')).toBe('2024-03-10');
  });
});
