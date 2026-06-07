import { describe, it, expect } from 'vitest';
import { calculateStreak, aggregateCalendars } from './calculate';
import type { ContributionCalendar } from '../types';

// Helper to check if a specific timezone is supported in the current runtime environment
const isTimezoneSupported = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Helper to construct a ContributionCalendar with explicit dates
// Ensures every week has exactly 7 contributionDays (GitHub layout invariant)
const buildCustomCalendar = (daysData: { date: string; count: number }[]): ContributionCalendar => {
  const weeks = [];
  for (let i = 0; i < daysData.length; i += 7) {
    const slice = daysData.slice(i, i + 7);
    while (slice.length < 7) {
      const lastDay = slice[slice.length - 1];
      const nextDate = new Date(
        new Date(lastDay.date + 'T00:00:00Z').getTime() + 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      slice.push({ date: nextDate, count: 0 });
    }
    weeks.push({
      contributionDays: slice.map((day) => ({
        contributionCount: day.count,
        date: day.date,
      })),
    });
  }
  return {
    totalContributions: daysData.reduce((sum, d) => sum + d.count, 0),
    weeks,
  };
};

describe('calculateStreak — year boundary transition timeline (Variation 4)', () => {
  it('calculates streaks correctly when spanning multiple sequential year transitions with date gaps (2023 -> 2024 -> 2025)', () => {
    // Generate dates from 2023-12-25 to 2025-01-05 purely in UTC to avoid DST skips
    const daysData: { date: string; count: number }[] = [];
    const startDate = new Date('2023-12-25T00:00:00Z');
    const endDate = new Date('2025-01-05T00:00:00Z');

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      // Set contributions on specific dates to create two separate streaks:
      // Streak 1: 2023-12-30 to 2024-01-02 (4 days)
      // Streak 2: 2024-12-30 to 2025-01-02 (4 days)
      let count = 0;
      if (
        (dateStr >= '2023-12-30' && dateStr <= '2024-01-02') ||
        (dateStr >= '2024-12-30' && dateStr <= '2025-01-02')
      ) {
        count = 1;
      }
      daysData.push({ date: dateStr, count });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const calendar = buildCustomCalendar(daysData);
    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-02T12:00:00Z'));

    expect(result.currentStreak).toBe(4); // 2024-12-30 to 2025-01-02
    expect(result.longestStreak).toBe(4);
    expect(result.todayDate).toBe('2025-01-02');
  });

  it('handles year boundary transitions under shifts between extreme timezone offsets (e.g. UTC+13 vs UTC-10)', () => {
    const hasNZ = isTimezoneSupported('Pacific/Auckland');
    const hasHonolulu = isTimezoneSupported('Pacific/Honolulu');

    if (!hasNZ || !hasHonolulu) {
      // Skip test if timezones are not supported in the local node runtime environment
      return;
    }

    const calendar = buildCustomCalendar([
      { date: '2024-12-30', count: 1 },
      { date: '2024-12-31', count: 1 },
      { date: '2025-01-01', count: 1 },
      { date: '2025-01-02', count: 1 },
    ]);

    const transitionTime = new Date('2024-12-31T22:00:00Z');

    // UTC+13 (e.g. Pacific/Auckland during DST) -> local time is Jan 1, 2025 (11:00 AM)
    const resultNZ = calculateStreak(calendar, 'Pacific/Auckland', transitionTime);
    expect(resultNZ.todayDate).toBe('2025-01-01');
    expect(resultNZ.currentStreak).toBe(3); // Dec 30, Dec 31, Jan 1

    // UTC-10 (e.g. Pacific/Honolulu) -> local time is Dec 31, 2024 (12:00 PM)
    const resultHonolulu = calculateStreak(calendar, 'Pacific/Honolulu', transitionTime);
    expect(resultHonolulu.todayDate).toBe('2024-12-31');
    expect(resultHonolulu.currentStreak).toBe(2); // Dec 30, Dec 31
  });

  it('verifies grace period threshold behavior across leap-to-non-leap year boundary rollovers when today has no contributions', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-29', count: 1 },
      { date: '2024-12-30', count: 1 },
      { date: '2024-12-31', count: 1 }, // End of Leap Year
      { date: '2025-01-01', count: 0 }, // Start of 2025 (today)
    ]);

    // Grace period of 1 should keep the current streak active on Jan 1
    const resultGrace1 = calculateStreak(calendar, 'UTC', new Date('2025-01-01T12:00:00Z'), 1);
    expect(resultGrace1.currentStreak).toBe(3); // Dec 29, Dec 30, Dec 31
    expect(resultGrace1.todayDate).toBe('2025-01-01');

    // Grace period of 0 should reset current streak on Jan 1
    const resultGrace0 = calculateStreak(calendar, 'UTC', new Date('2025-01-01T12:00:00Z'), 0);
    expect(resultGrace0.currentStreak).toBe(0);
  });

  it('evaluates current streak correctly when today is in the new year but contributions end on Dec 31 (stale calendar)', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-25', count: 0 },
      { date: '2024-12-26', count: 0 },
      { date: '2024-12-27', count: 0 },
      { date: '2024-12-28', count: 0 },
      { date: '2024-12-29', count: 0 },
      { date: '2024-12-30', count: 1 },
      { date: '2024-12-31', count: 1 }, // Calendar ends here (exactly 7 days, 1 full week)
    ]);

    // Today is Jan 2, 2025 (stale calendar)
    // localTodayStr = '2025-01-02' > lastDateStr = '2024-12-31'. It will fallback to last index ('2024-12-31').
    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-02T12:00:00Z'), 1);
    expect(result.currentStreak).toBe(2); // Dec 30, Dec 31 are active
    expect(result.todayDate).toBe('2024-12-31');
  });

  it('calculates streaks correctly across year boundaries on aggregated organization calendars', () => {
    const user1Calendar = buildCustomCalendar([
      { date: '2024-12-31', count: 1 }, // Dec 31 contribution
      { date: '2025-01-01', count: 0 },
    ]);
    const user2Calendar = buildCustomCalendar([
      { date: '2024-12-31', count: 0 },
      { date: '2025-01-01', count: 1 }, // Jan 1 contribution
    ]);

    // Merging user 1 and user 2 calendars creates a continuous streak spanning year boundary
    const aggregatedCalendar = aggregateCalendars([user1Calendar, user2Calendar]);

    const result = calculateStreak(aggregatedCalendar, 'UTC', new Date('2025-01-01T12:00:00Z'));
    expect(result.currentStreak).toBe(2); // Dec 31, Jan 1
    expect(result.longestStreak).toBe(2);
    expect(result.todayDate).toBe('2025-01-01');
  });
});
