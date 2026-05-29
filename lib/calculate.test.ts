import { describe, it, expect } from 'vitest';
import {
  calculateStreak,
  calculateMonthlyStats,
  isStreakAlive,
  aggregateCalendars,
  calculateWrappedStats,
} from './calculate';
import type { ContributionCalendar } from '../types';

// Turns a flat array of daily counts into the ContributionCalendar shape,
// grouping every 7 values into a "week" — the same way GitHub's API returns data.
function buildCalendar(counts: number[]): ContributionCalendar {
  const weeks = [];
  for (let i = 0; i < counts.length; i += 7) {
    const slice = counts.slice(i, i + 7);
    weeks.push({
      contributionDays: slice.map((count, j) => ({
        contributionCount: count,
        date: `2024-01-${String(i + j + 1).padStart(2, '0')}`,
      })),
    });
  }
  return {
    totalContributions: counts.reduce((a, b) => a + b, 0),
    weeks,
  };
}

describe('calculateStreak', () => {
  it('returns all zeros for a user with 0 contributions', () => {
    // Both today and yesterday are 0, so no grace period can save the streak.
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      0,
      0, // week 1
      0,
      0,
      0,
      0,
      0,
      0,
      0, // week 2
    ]);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
  });

  it('counts an active streak when the last day has contributions', () => {
    // The last element represents "today" — committing today keeps the streak alive.
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      1,
      1, // week 1
      1,
      1,
      1,
      1,
      1,
      1,
      1, // week 2 — last day is "today"
    ]);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(9);
    expect(result.longestStreak).toBe(9);
    expect(result.totalContributions).toBe(9);
  });

  it('resets currentStreak to 0 when both today and yesterday have 0 contributions', () => {
    // The 5-day run ends on day 12; days 13 (yesterday) and 14 (today) are both 0,
    // so neither the active check nor the grace period can rescue the streak.
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      0,
      0, // week 1
      1,
      1,
      1,
      1,
      1,
      0,
      0, // week 2 — streak broken
    ]);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(5);
    expect(result.totalContributions).toBe(5);
  });

  it('tracks the longest streak independently of the current streak', () => {
    // Week 1 holds the all-time record (7 days). After the gap on day 8,
    // a fresh 6-day run ends on "today", so current < longest.
    const calendar = buildCalendar([
      1,
      1,
      1,
      1,
      1,
      1,
      1, // week 1 — 7-day streak (the record)
      0,
      1,
      1,
      1,
      1,
      1,
      1, // week 2 — 6-day streak ending today
    ]);

    const result = calculateStreak(calendar);

    expect(result.longestStreak).toBe(7);
    expect(result.currentStreak).toBe(6);
    expect(result.totalContributions).toBe(13);
  });

  it('keeps the streak alive via the grace period when only yesterday has contributions', () => {
    // Today is 0, but yesterday is 1 — the grace period treats the streak as still active.
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      0,
      0, // week 1
      0,
      0,
      0,
      0,
      1,
      1,
      0, // week 2 — today=0, yesterday=1 (grace period)
    ]);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('keeps the streak alive with a grace period > 1 (e.g. grace=2)', () => {
    // Today is 0, yesterday is 0, but 2 days ago is 1.
    // With grace=1 (default), streak is broken. With grace=2, streak is alive.
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      0,
      0, // week 1
      0,
      0,
      0,
      0,
      1,
      0,
      0, // week 2 — today=0, yesterday=0, day before=1
    ]);

    // Using default grace (1)
    const resultGrace1 = calculateStreak(calendar, 'UTC', undefined, 1);
    expect(resultGrace1.currentStreak).toBe(0);

    // Using grace = 2
    const resultGrace2 = calculateStreak(calendar, 'UTC', undefined, 2);
    expect(resultGrace2.currentStreak).toBe(1);
    expect(resultGrace2.longestStreak).toBe(1);
  });

  it('handles a single active day without crashing (edge case: no "yesterday")', () => {
    // A calendar with only one day could make `days[todayIndex - 1]` undefined.
    // The function should survive this gracefully and return currentStreak = 1.
    const calendar = buildCalendar([1]);

    expect(() => calculateStreak(calendar)).not.toThrow();
    const result = calculateStreak(calendar);
    expect(result.totalContributions).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('does not walk past the start of a 1-day calendar when grace is larger than the available days', () => {
    const calendar = buildCalendar([1]);

    const result = calculateStreak(calendar, 'UTC', undefined, 7);
    expect(result.currentStreak).toBe(1);
  });

  it('handles a single inactive day safely (0 contributions)', () => {
    const calendar = buildCalendar([0]);
    expect(() => calculateStreak(calendar)).not.toThrow();
    const result = calculateStreak(calendar);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('handles an empty contribution calendar safely without crashing', () => {
    const calendar = buildCalendar([]);
    expect(() => calculateStreak(calendar)).not.toThrow();
    const result = calculateStreak(calendar);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('should find the longest streak when it is in the middle of the calendar', () => {
    // buildCalendar groups elements by sets of 7 (weeks) from left to right.
    // The very last element of the flat array represents "today".
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      0,
      0, // Week 1 — Buffer gap
      1,
      1,
      1,
      1,
      1,
      1,
      1, // Week 2 — Longest streak start (7 days)
      1,
      1,
      1,
      0,
      0,
      0,
      0, // Week 3 — Longest streak ends (+3 days = 10 total) followed by a gap
      1,
      1,
      1,
      1,
      1,
      0,
      0, // Week 4 — Intermediate streak (5 days) broken by a gap
      0,
      0,
      1,
      1,
      1,
      1,
      1, // Week 5 — 5-day active current streak ending on the final day ("today")
    ]);

    const result = calculateStreak(calendar);

    // Assertions (Definition of Done)
    expect(result.longestStreak).toBe(10);
    expect(result.currentStreak).toBe(5);
  });
});

describe('calculateStreak — timezone awareness', () => {
  const tzCalendar = {
    totalContributions: 3,
    weeks: [
      {
        contributionDays: [
          { contributionCount: 1, date: '2024-06-12' },
          { contributionCount: 1, date: '2024-06-13' },
          { contributionCount: 1, date: '2024-06-14' },
          { contributionCount: 0, date: '2024-06-15' },
          { contributionCount: 0, date: '2024-06-16' },
        ],
      },
    ],
  };

  const nowUTC = new Date('2024-06-16T07:00:00.000Z');

  it('breaks the streak when evaluated in UTC because today and yesterday both have 0 commits', () => {
    const result = calculateStreak(tzCalendar, 'UTC', nowUTC);
    expect(result.currentStreak).toBe(0);
  });

  it('preserves the streak when the local date (UTC-8) maps to a day with commits via grace period', () => {
    const result = calculateStreak(tzCalendar, 'Etc/GMT+8', nowUTC);
    expect(result.currentStreak).toBe(3);
  });

  it('falls back to the last available day when the local date is ahead of the calendar data', () => {
    const futureNow = new Date('2024-06-16T12:00:00.000Z');
    const result = calculateStreak(tzCalendar, 'Etc/GMT-14', futureNow);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  it('still calculates longestStreak correctly regardless of timezone', () => {
    const result = calculateStreak(tzCalendar, 'Etc/GMT+8', nowUTC);
    expect(result.longestStreak).toBe(3);
    expect(result.totalContributions).toBe(3);
  });

  it('returns the correct local todayDate for use by the SVG generator', () => {
    const result = calculateStreak(tzCalendar, 'Etc/GMT+8', nowUTC);
    expect(result.todayDate).toBe('2024-06-15');
  });

  it('returns UTC date as todayDate when no timezone is given', () => {
    const result = calculateStreak(tzCalendar, 'UTC', nowUTC);
    expect(result.todayDate).toBe('2024-06-16');
  });
});

describe('isStreakAlive', () => {
  it('returns true when both today and yesterday have contributions', () => {
    expect(isStreakAlive({ contributionCount: 1 }, { contributionCount: 1 })).toBe(true);
  });

  it('returns true when only today has contributions', () => {
    expect(isStreakAlive({ contributionCount: 1 }, { contributionCount: 0 })).toBe(true);
  });

  it('returns true when only yesterday has contributions', () => {
    expect(isStreakAlive({ contributionCount: 0 }, { contributionCount: 1 })).toBe(true);
  });

  it('returns false when both today and yesterday have zero contributions', () => {
    expect(isStreakAlive({ contributionCount: 0 }, { contributionCount: 0 })).toBe(false);
  });

  it('returns false when yesterday is null and today has no contributions', () => {
    expect(isStreakAlive({ contributionCount: 0 }, null)).toBe(false);
  });
});

describe('calculateMonthlyStats', () => {
  it('calculates monthly stats correctly when both months have commits', () => {
    const calendar = {
      totalContributions: 15,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 5, date: '2024-05-15' },
            { contributionCount: 10, date: '2024-06-10' },
          ],
        },
      ],
    };
    const now = new Date('2024-06-15T12:00:00Z');
    const result = calculateMonthlyStats(calendar, 'UTC', now);

    expect(result.currentMonthTotal).toBe(10);
    expect(result.previousMonthTotal).toBe(5);
    expect(result.deltaAbsolute).toBe(5);
    expect(result.deltaPercentage).toBe(100);
    expect(result.currentMonthName).toBe('June');
  });

  it('handles zero previous month contributions', () => {
    const calendar = {
      totalContributions: 10,
      weeks: [
        {
          contributionDays: [{ contributionCount: 10, date: '2024-06-10' }],
        },
      ],
    };
    const now = new Date('2024-06-15T12:00:00Z');
    const result = calculateMonthlyStats(calendar, 'UTC', now);

    expect(result.previousMonthTotal).toBe(0);
    expect(result.currentMonthTotal).toBe(10);
    expect(result.deltaPercentage).toBeNull();
  });

  it('handles zero current month contributions', () => {
    const calendar = {
      totalContributions: 5,
      weeks: [
        {
          contributionDays: [{ contributionCount: 5, date: '2024-05-10' }],
        },
      ],
    };
    const now = new Date('2024-06-15T12:00:00Z');
    const result = calculateMonthlyStats(calendar, 'UTC', now);

    expect(result.previousMonthTotal).toBe(5);
    expect(result.currentMonthTotal).toBe(0);
    expect(result.deltaPercentage).toBe(-100);
  });

  it('handles negative delta correctly', () => {
    const calendar = {
      totalContributions: 15,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 10, date: '2024-05-10' },
            { contributionCount: 5, date: '2024-06-10' },
          ],
        },
      ],
    };
    const now = new Date('2024-06-15T12:00:00Z');
    const result = calculateMonthlyStats(calendar, 'UTC', now);

    expect(result.previousMonthTotal).toBe(10);
    expect(result.currentMonthTotal).toBe(5);
    expect(result.deltaPercentage).toBe(-50);
    expect(result.deltaAbsolute).toBe(-5);
  });

  it('handles year boundary correctly (Jan vs Dec)', () => {
    const calendar = {
      totalContributions: 15,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 10, date: '2023-12-15' },
            { contributionCount: 5, date: '2024-01-15' },
          ],
        },
      ],
    };
    const now = new Date('2024-01-15T12:00:00Z');
    const result = calculateMonthlyStats(calendar, 'UTC', now);

    expect(result.previousMonthTotal).toBe(10);
    expect(result.currentMonthTotal).toBe(5);
    expect(result.currentMonthName).toBe('January');
  });
  // =========================================================================
  // ISSUE OBJECTIVE: Empty calendar passed to calculateMonthlyStats
  // =========================================================================
  it('returns zeros and does not crash when given an empty calendar', () => {
    const emptyCalendar = {
      totalContributions: 0,
      weeks: [],
    } as Parameters<typeof calculateMonthlyStats>[0];

    const testDate = new Date('2026-05-29T12:00:00Z');
    let result: ReturnType<typeof calculateMonthlyStats>;

    // 1. Assert does not throw
    expect(() => {
      result = calculateMonthlyStats(emptyCalendar, 'UTC', testDate);
    }).not.toThrow();

    // 2. Assert currentMonthTotal === 0
    expect(result!.currentMonthTotal).toBe(0);

    // 3. Assert previousMonthTotal === 0
    expect(result!.previousMonthTotal).toBe(0);
  });
});

describe('calculateStreak — empty and sparse year edge cases', () => {
  it('returns stable output when all weeks have zero-contribution days', () => {
    const calendar = buildCalendar([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const result = calculateStreak(calendar);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.todayDate).toBeDefined();
  });

  it('is deterministic: same empty calendar always returns identical output', () => {
    const calendar = buildCalendar([]);
    const fixedNow = new Date('2024-01-15T12:00:00Z');
    const r1 = calculateStreak(calendar, 'UTC', fixedNow);
    const r2 = calculateStreak(calendar, 'UTC', fixedNow);
    expect(r1).toEqual(r2);
  });

  it('handles partial year — only one week of data — without crashing', () => {
    const calendar = buildCalendar([0, 1, 0, 0, 1, 0, 0]);
    expect(() => calculateStreak(calendar)).not.toThrow();
    const result = calculateStreak(calendar);
    expect(result.longestStreak).toBe(1);
    expect(result.totalContributions).toBe(2);
  });
});

// ---------- EPIC ENHANCEMENT TESTS ----------

describe('aggregateCalendars', () => {
  it('returns an empty calendar if no calendars are provided', () => {
    const result = aggregateCalendars([]);
    expect(result.totalContributions).toBe(0);
    expect(result.weeks).toEqual([]);
  });

  it('aggregates multiple calendars correctly for orgs', () => {
    const cal1 = buildCalendar([1, 0, 2]); // total: 3
    const cal2 = buildCalendar([0, 3, 1]); // total: 4

    const result = aggregateCalendars([cal1, cal2]);

    expect(result.totalContributions).toBe(7);
    expect(result.weeks[0].contributionDays[0].contributionCount).toBe(1); // 1 + 0
    expect(result.weeks[0].contributionDays[1].contributionCount).toBe(3); // 0 + 3
    expect(result.weeks[0].contributionDays[2].contributionCount).toBe(3); // 2 + 1
  });
});

describe('calculateWrappedStats', () => {
  it('calculates GitHub Wrapped stats accurately', () => {
    // 2024-01-01 was a Monday. Indices 5 (Sat) and 6 (Sun) are the weekend.
    const cal = buildCalendar([0, 0, 0, 0, 0, 5, 15]);

    const result = calculateWrappedStats(cal);

    expect(result.totalContributions).toBe(20);
    expect(result.highestDailyCount).toBe(15);
    expect(result.mostActiveDate).toBe('2024-01-07');
    expect(result.busiestMonth).toBe('2024-01');
    expect(result.weekendRatio).toBe(100);
  });
  // =========================================================================
  // ISSUE OBJECTIVE: Verify weekendRatio is 100 when all commits are on weekends
  // =========================================================================
  it('returns weekendRatio === 100 when all contributions are on weekends', () => {
    // Note: 2026-05-02 is a Saturday, 2026-05-03 is a Sunday, 2026-05-04 is a Monday
    const weekendCalendar = {
      totalContributions: 10,
      weeks: [
        {
          contributionDays: [
            { date: '2026-05-02', contributionCount: 5 }, // Saturday (Weekend)
            { date: '2026-05-03', contributionCount: 5 }, // Sunday (Weekend)
            { date: '2026-05-04', contributionCount: 0 }, // Monday (Weekday - 0 commits)
          ],
        },
      ],
    } as Parameters<typeof calculateWrappedStats>[0]; // Safely infers the exact type the function expects!

    const result = calculateWrappedStats(weekendCalendar);

    // Assert the ratio is exactly 100%
    expect(result.weekendRatio).toBe(100);
  });
});
