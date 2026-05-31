import { describe, it, expect, vi } from 'vitest';
import {
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
  calculateWrappedStats,
  findTodayIndex,
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
  it('verifies weekend only streaks', () => {
    const c = buildCalendar([1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1]);
    const s = calculateStreak(c);
    expect(s.longestStreak).toBe(2);
  });

  it('handles multiple weeks of zero contributions separating active streaks', () => {
    const calendar = buildCalendar([
      // Week 1 - active streak
      1, 1, 1, 1, 1, 1, 1,

      // Week 2 - gap
      0, 0, 0, 0, 0, 0, 0,

      // Week 3 - gap
      0, 0, 0, 0, 0, 0, 0,

      // Week 4 - new streak
      1, 1, 1, 1, 1, 1, 1,
    ]);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(7);
    expect(result.totalContributions).toBe(14);
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

  it('counts weekday-only commits from Monday through Friday without spanning weekend gaps', () => {
    // 2024-01-01 is a Monday. Commits happen only on weekdays across two work weeks.
    const calendar = buildCalendar([
      1,
      1,
      1,
      1,
      1,
      0,
      0, // Mon-Fri active, Sat-Sun inactive
      1,
      1,
      1,
      1,
      1, // Mon-Fri active again, ending on Friday
    ]);

    const result = calculateStreak(calendar, 'UTC', new Date('2024-01-12T12:00:00Z'));

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.totalContributions).toBe(10);
    expect(result.todayDate).toBe('2024-01-12');
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

  it('correctly handles leap years and non-leap years during the Feb 28 to Mar 1 transition', () => {
    // Helper to construct a ContributionCalendar with explicit dates
    const buildCustomCalendar = (
      daysData: { date: string; count: number }[]
    ): ContributionCalendar => {
      const weeks = [];
      for (let i = 0; i < daysData.length; i += 7) {
        const slice = daysData.slice(i, i + 7);
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

    // --- Case 1: Non-Leap Year (2023) ---
    // In 2023, Feb has 28 days. Feb 28 is followed directly by Mar 1.
    const nonLeapCalendar = buildCustomCalendar([
      { date: '2023-02-27', count: 1 },
      { date: '2023-02-28', count: 1 },
      { date: '2023-03-01', count: 1 },
      { date: '2023-03-02', count: 1 },
    ]);

    // Evaluating on March 2, 2023:
    // With commits on Feb 27, Feb 28, Mar 1, and Mar 2, the streak should be continuous (4 days).
    const resultNonLeap = calculateStreak(nonLeapCalendar, 'UTC', new Date('2023-03-02T12:00:00Z'));
    expect(nonLeapCalendar.totalContributions).toBe(4);
    expect(resultNonLeap.currentStreak).toBe(4);
    expect(resultNonLeap.longestStreak).toBe(4);

    // --- Case 2: Leap Year (2024) ---
    // In 2024, Feb has 29 days.
    // If they commit on Feb 28, Feb 29, and Mar 1: streak should be 3.
    const leapCalendarContinuous = buildCustomCalendar([
      { date: '2024-02-27', count: 0 },
      { date: '2024-02-28', count: 1 },
      { date: '2024-02-29', count: 1 },
      { date: '2024-03-01', count: 1 },
    ]);

    const resultLeapContinuous = calculateStreak(
      leapCalendarContinuous,
      'UTC',
      new Date('2024-03-01T12:00:00Z')
    );
    expect(resultLeapContinuous.currentStreak).toBe(3);
    expect(resultLeapContinuous.longestStreak).toBe(3);

    // --- Case 3: Leap Year (2024) with a gap on Feb 29 ---
    // In 2024, if they commit on Feb 28 and Mar 1 but miss Feb 29:
    // Evaluating on Mar 1 (grace period = 1):
    // Today (Mar 1) has 1 commit. Yesterday (Feb 29) has 0 commits.
    // Since grace is 1, the streak is alive.
    // However, since Feb 29 is 0, the backward count stops after today (Mar 1).
    // So the current streak should be 1, and the longest streak should be 1.
    const leapCalendarWithGap = buildCustomCalendar([
      { date: '2024-02-27', count: 0 },
      { date: '2024-02-28', count: 1 },
      { date: '2024-02-29', count: 0 }, // Gap on leap day!
      { date: '2024-03-01', count: 1 },
    ]);

    const resultLeapGap = calculateStreak(
      leapCalendarWithGap,
      'UTC',
      new Date('2024-03-01T12:00:00Z')
    );
    expect(resultLeapGap.currentStreak).toBe(1);
    expect(resultLeapGap.longestStreak).toBe(1);
  });

  it('correctly calculates current and longest streaks when commits are made exclusively on Saturdays and Sundays', () => {
    // 2024-01-01 is a Monday.
    // Days in a week: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    // Index:          0,   1,   2,   3,   4,   5,   6
    // Commits only on Sat (index 5) and Sun (index 6).
    // Week 1: 0, 0, 0, 0, 0, 1, 1 (Sat Jan 6, Sun Jan 7)
    // Week 2: 0, 0, 0, 0, 0, 1, 1 (Sat Jan 13, Sun Jan 14)
    // Week 3: 0, 0, 0, 0, 0, 1, 1 (Sat Jan 20, Sun Jan 21)
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 1 (Jan 1 to Jan 7)
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 2 (Jan 8 to Jan 14)
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 3 (Jan 15 to Jan 21)
    ]);

    // 1. Evaluate on Sunday, Jan 21, 2024 (which is the last day with commits)
    // The current streak should be 2 (Sat & Sun) because weekdays are empty.
    // The longest streak should be 2.
    const resultSunday = calculateStreak(calendar, 'UTC', new Date('2024-01-21T12:00:00Z'));
    expect(resultSunday.currentStreak).toBe(2);
    expect(resultSunday.longestStreak).toBe(2);

    // 2. Evaluate on Monday, Jan 22, 2024 (weekdays have no commits, index 21 has 0 commits)
    // Let's construct a calendar including Monday Jan 22 so "today" is explicitly present in the data.
    const calendarWithMonday = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 1 (Jan 1 to Jan 7)
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 2 (Jan 8 to Jan 14)
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 3 (Jan 15 to Jan 21)
      0, // Monday, Jan 22 (0 commits)
    ]);

    // Monday (today is 0, yesterday Sunday was 1) - grace period of 1 should keep the streak alive.
    // So current streak should still be 2.
    const resultMonday = calculateStreak(
      calendarWithMonday,
      'UTC',
      new Date('2024-01-22T12:00:00Z')
    );
    expect(resultMonday.currentStreak).toBe(2);
    expect(resultMonday.longestStreak).toBe(2);

    // 3. Evaluate on Tuesday, Jan 23, 2024 (index 22 has 0 commits)
    const calendarWithTuesday = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 1 (Jan 1 to Jan 7)
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 2 (Jan 8 to Jan 14)
      0,
      0,
      0,
      0,
      0,
      1,
      1, // Week 3 (Jan 15 to Jan 21)
      0,
      0, // Monday Jan 22, Tuesday Jan 23 (0 commits)
    ]);

    // Tuesday (today is 0, yesterday Monday is 0) - grace period of 1 cannot keep it alive.
    // So current streak resets to 0.
    const resultTuesday = calculateStreak(
      calendarWithTuesday,
      'UTC',
      new Date('2024-01-23T12:00:00Z')
    );
    expect(resultTuesday.currentStreak).toBe(0);
    expect(resultTuesday.longestStreak).toBe(2);
  });

  it('verify streak formulas for different starting days of the week timeline (Variation 2)', () => {
    // Week 1: 0, 0, 1, 1, 1, 1, 1 (Starts on Wednesday, 5 days)
    // Week 2: 1, 1, 1, 1, 1, 1, 1 (7 days)
    // Week 3: 1, 1, 1              // Ends on Wednesday (3 days)
    // Total continuous streak = 15 days, ending on the last day.
    const calendar = buildCalendar([
      0,
      0,
      1,
      1,
      1,
      1,
      1, // Week 1 (Starts Wed)
      1,
      1,
      1,
      1,
      1,
      1,
      1, // Week 2
      1,
      1,
      1, // Week 3 (Ends Wed)
    ]);
    const result = calculateStreak(calendar);
    expect(result.currentStreak).toBe(15);
    expect(result.longestStreak).toBe(15);
  });

  it('verify streak formulas for multiple weeks gaps timeline (Variation 3)', () => {
    // Streak 1: 5 days
    // Gap 1: 14 days (2 weeks of zeros)
    // Streak 2: 10 days (longest)
    // Gap 2: 21 days (3 weeks of zeros)
    // Streak 3: 3 days (current) ending on the last day
    const calendar = buildCalendar([
      1,
      1,
      1,
      1,
      1, // Streak 1 (5 days)
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // Gap 1 (14 days)
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1, // Streak 2 (10 days)
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // Gap 2 (21 days)
      1,
      1,
      1, // Streak 3 (3 days - ending on last day)
    ]);
    const result = calculateStreak(calendar);
    expect(result.longestStreak).toBe(10);
    expect(result.currentStreak).toBe(3);
  });

  it('verify streak formulas for single day contribution timeline (Variation 3)', () => {
    // Simulating 1 day of commits, preceded and followed by empty weeks.
    // 7 empty days (1 week), 1 day of commits (1 contribution), 7 empty days (1 week)
    const calendar = buildCalendar([
      0,
      0,
      0,
      0,
      0,
      0,
      0, // Week 1: Empty week
      1, // 1 day of commits
      0,
      0,
      0,
      0,
      0,
      0,
      0, // Week 2: Empty week
    ]);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.totalContributions).toBe(1);
  });
});

it('handles massive single-day commit spike timeline', () => {
  const calendar = buildCalendar([
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 120, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
  ]);

  const result = calculateStreak(calendar);

  expect(result.currentStreak).toBe(7);
  expect(result.longestStreak).toBe(7);
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

  it('handles commits around midnight correctly across timezone offsets', () => {
    const calendar = {
      totalContributions: 2,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-06-12' },
            { contributionCount: 1, date: '2024-06-13' },
            { contributionCount: 1, date: '2024-06-14' },
            { contributionCount: 0, date: '2024-06-15' },
          ],
        },
      ],
    };

    const nowUTC = new Date('2024-06-14T23:59:00.000Z');

    const utcResult = calculateStreak(calendar, 'UTC', nowUTC);
    const aheadOffsetResult = calculateStreak(calendar, 'Etc/GMT-1', nowUTC);

    expect(utcResult.todayDate).toBe('2024-06-14');
    expect(utcResult.currentStreak).toBe(2);
    expect(utcResult.longestStreak).toBe(2);

    expect(aheadOffsetResult.todayDate).toBe('2024-06-15');
    expect(aheadOffsetResult.currentStreak).toBe(2);
    expect(aheadOffsetResult.longestStreak).toBe(2);
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

  it('calculates streak correctly during a spring-forward DST transition edge case', () => {
    // 1. We must mock the system clock so 'new Date()' behaves predictably
    vi.useFakeTimers();

    // 2. Use America/New_York (spring-forward: 2024-03-10)
    process.env.TZ = 'America/New_York';

    // 3. Set `now` to early UTC on March 10.
    // 03:00:00 UTC on March 10 is 22:00:00 (10:00 PM) on March 9 in New York (EST).
    const mockNow = new Date('2024-03-10T03:00:00.000Z');
    vi.setSystemTime(mockNow);

    // 4. Build a calendar with contributions on March 9 and March 10
    const dstCalendar = {
      totalContributions: 2,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 1, date: '2024-03-09' },
            { contributionCount: 1, date: '2024-03-10' },
          ],
        },
      ],
    } as Parameters<typeof calculateStreak>[0];

    // 5. Assert currentStreak is calculated correctly
    const result = calculateStreak(dstCalendar, 'America/New_York');

    // Because it is currently March 9th in New York, the current streak should securely be 1
    expect(result.currentStreak).toBe(1);

    // 6. Cleanup to prevent breaking other tests
    vi.useRealTimers();
    process.env.TZ = '';
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

  it('verify January correctly uses December of previous year with explicit now baseline', () => {
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
    const now = new Date('2024-01-20T12:00:00Z');
    const result = calculateMonthlyStats(calendar, 'UTC', now);

    // Assertions matching the explicit issue Definition of Done
    expect(result.currentMonthTotal).toBe(5);
    expect(result.previousMonthTotal).toBe(10);
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

  // =========================================================================
  // ISSUE #1503 — Variation 4: Full year (52 weeks × 7 days) of 0 contributions
  // =========================================================================
  // Background: streak computation is susceptible to off-by-one errors when
  // managing calendar offsets and date boundaries. A full year of zero commits
  // is the most exhaustive boundary stress-test: the loop must traverse all 364
  // days without incrementing either streak counter, and must not throw or return
  // NaN/undefined due to boundary arithmetic on the first or last day.
  it('returns all zeros for an entire year (52 weeks × 7 days) of empty contributions (Variation 4)', () => {
    // 52 weeks × 7 days = 364 days, every day has 0 commits.
    // buildCalendar groups them into 52 weeks automatically.
    const emptyYearCounts = Array(364).fill(0);
    const calendar = buildCalendar(emptyYearCounts);

    const result = calculateStreak(calendar);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
  });
});

describe('calculateStreak — todayDate format', () => {
  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  it('todayDate matches YYYY-MM-DD for a normal calendar', () => {
    // A typical calendar with contributions — todayDate must always be a valid date string
    // regardless of the contribution data, so the SVG pulse animation targets the right tower.
    const calendar = buildCalendar([1, 0, 1, 1, 0, 1, 1]);
    const fixedNow = new Date('2024-01-07T12:00:00Z');
    const result = calculateStreak(calendar, 'UTC', fixedNow);
    expect(result.todayDate).toMatch(DATE_REGEX);
  });

  it('todayDate matches YYYY-MM-DD for an empty calendar', () => {
    // An empty calendar has no days to fall back on, so todayDate is derived
    // purely from the current date — it must still be a valid YYYY-MM-DD string.
    const emptyCalendar = buildCalendar([]);
    const fixedNow = new Date('2024-03-15T00:00:00Z');
    const result = calculateStreak(emptyCalendar, 'UTC', fixedNow);
    expect(result.todayDate).toMatch(DATE_REGEX);
  });

  it('todayDate matches YYYY-MM-DD when a non-UTC timezone shifts the local date', () => {
    // When the caller passes a timezone like Asia/Kolkata, the local date can differ
    // from UTC (e.g. UTC is still Jan 14 but IST is already Jan 15).
    // The format must remain YYYY-MM-DD regardless of which day the timezone lands on.
    const calendar = buildCalendar([1, 1, 1, 1, 1, 1, 1]);
    const fixedNow = new Date('2024-01-07T20:00:00Z'); // 01:30 Jan 8 in IST (UTC+5:30)
    const result = calculateStreak(calendar, 'Asia/Kolkata', fixedNow);
    expect(result.todayDate).toMatch(DATE_REGEX);
  });
});

describe('calculateStreak — year boundary transition (Dec 31 → Jan 1)', () => {
  // Streak math relies on the flattened day array being chronologically ordered,
  // so a run that crosses from December into January must be counted as a single
  // continuous streak. This guards against off-by-one bugs where the calendar
  // year rollover (e.g. 2024-12-31 → 2025-01-01) is mistakenly treated as a gap.
  it('counts a streak that spans the Dec 31 → Jan 1 boundary as one continuous run', () => {
    const calendar: ContributionCalendar = {
      totalContributions: 7,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 0, date: '2024-12-26' }, // gap before the streak begins
            { contributionCount: 1, date: '2024-12-27' },
            { contributionCount: 1, date: '2024-12-28' },
            { contributionCount: 1, date: '2024-12-29' },
            { contributionCount: 1, date: '2024-12-30' },
            { contributionCount: 1, date: '2024-12-31' }, // last day of the year
            { contributionCount: 1, date: '2025-01-01' }, // first day of the new year
          ],
        },
        {
          contributionDays: [
            { contributionCount: 1, date: '2025-01-02' }, // "today"
          ],
        },
      ],
    };

    // Pin "now" to Jan 2 so the final day is treated as today and the streak is live.
    const now = new Date('2025-01-02T12:00:00Z');
    const result = calculateStreak(calendar, 'UTC', now);

    // The 7-day run (Dec 27 → Jan 2) must not be split by the year rollover.
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(7);
    expect(result.totalContributions).toBe(7);
    expect(result.todayDate).toBe('2025-01-02');
  });
});

// ---------- EPIC ENHANCEMENT TESTS ----------

describe('aggregateCalendars', () => {
  it('handles calendars with different numbers of weeks', () => {
    const cal1 = {
      totalContributions: 15,
      weeks: [
        {
          contributionDays: [{ date: '2024-01-01', contributionCount: 5 }],
        },
        {
          contributionDays: [{ date: '2024-01-08', contributionCount: 10 }],
        },
      ],
    };

    const cal2 = {
      totalContributions: 3,
      weeks: [
        {
          contributionDays: [{ date: '2024-01-01', contributionCount: 3 }],
        },
      ],
    };

    const result = aggregateCalendars([cal1, cal2]);

    expect(result.weeks).toHaveLength(2);
    expect(result.weeks[0].contributionDays[0].contributionCount).toBe(8);
    expect(result.weeks[1].contributionDays[0].contributionCount).toBe(10);
  });

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
  it('returns weekendRatio as 0 when all contributions occur on weekdays', () => {
    const calendar = {
      totalContributions: 25,
      weeks: [
        {
          contributionDays: [
            { date: '2024-01-01', contributionCount: 5 }, // Mon
            { date: '2024-01-02', contributionCount: 5 }, // Tue
            { date: '2024-01-03', contributionCount: 5 }, // Wed
            { date: '2024-01-04', contributionCount: 5 }, // Thu
            { date: '2024-01-05', contributionCount: 5 }, // Fri
          ],
        },
      ],
    };

    const result = calculateWrappedStats(calendar);

    expect(result.weekendRatio).toBe(0);
  });

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

  // ISSUE OBJECTIVE #1056: Verify empty calendar returns safe zero values
  it('verify empty calendar returns safe zero values', () => {
    // 1. Call calculateWrappedStats with empty data
    expect(() => calculateWrappedStats({ totalContributions: 0, weeks: [] })).not.toThrow();

    // 2. Actually get the result to test its properties
    const result = calculateWrappedStats({ totalContributions: 0, weeks: [] });

    // 3. Assert weekendRatio === 0 (and specifically not NaN)
    expect(result.weekendRatio).toBe(0);

    // 4. Assert highestDailyCount === 0
    expect(result.highestDailyCount).toBe(0);
  });

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

  it('correctly calculates streak when utc midnight maps to different local dates', () => {
    // Calendar: contributions on Jan 14 and Jan 15 (consecutive days)
    const calendar = {
      totalContributions: 2,
      weeks: [
        {
          contributionDays: [
            { contributionCount: 1, date: '2024-01-14' },
            { contributionCount: 1, date: '2024-01-15' },
          ],
        },
      ],
    };

    // UTC: 2024-01-15T04:59:00Z maps to:
    // - 2024-01-15 in UTC (after midnight)
    // - 2024-01-14T23:59:00 in UTC-5 (before midnight, same local day as yesterday)
    // - 2024-01-15T09:59:00 in UTC+5 (well into the new day)
    const nowUTC = new Date('2024-01-15T04:59:00Z');

    // Streak in UTC: today=Jan15, yesterday=Jan14, both have contributions → streak=2
    const resultUTC = calculateStreak(calendar, 'UTC', nowUTC);
    expect(resultUTC.currentStreak).toBe(2);
    expect(resultUTC.todayDate).toBe('2024-01-15');

    // Streak in UTC-5: today=Jan14, only Jan14 is in scope → streak=1
    const resultUTCMinus5 = calculateStreak(calendar, 'Etc/GMT+5', nowUTC);
    expect(resultUTCMinus5.currentStreak).toBe(1);
    expect(resultUTCMinus5.todayDate).toBe('2024-01-14');

    // Streak in UTC+5: today=Jan15, yesterday=Jan14, both have contributions → streak=2
    const resultUTCPlus5 = calculateStreak(calendar, 'Etc/GMT-5', nowUTC);
    expect(resultUTCPlus5.currentStreak).toBe(2);
    expect(resultUTCPlus5.todayDate).toBe('2024-01-15');
  });
});

describe('findTodayIndex', () => {
  it('returns index when date is found', () => {
    const days = [
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 2 },
      { date: '2024-01-03', contributionCount: 3 },
    ];

    const result = findTodayIndex(days, 'UTC', new Date('2024-01-02T12:00:00Z'));

    expect(result).toBe(1);
  });

  it('falls back to last index when date is not found', () => {
    const days = [
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 2 },
      { date: '2024-01-03', contributionCount: 3 },
    ];

    const result = findTodayIndex(days, 'UTC', new Date('2024-01-10T12:00:00Z'));

    expect(result).toBe(2);
  });

  it('returns -1 for empty days array', () => {
    const result = findTodayIndex([], 'UTC', new Date('2024-01-10T12:00:00Z'));

    expect(result).toBe(-1);
  });
});
