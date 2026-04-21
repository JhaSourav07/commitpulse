import { describe, it, expect } from 'vitest';
import { calculateStreak } from './calculate';
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

  it('handles a single active day without crashing (edge case: no "yesterday")', () => {
    // A calendar with only one day could make `days[todayIndex - 1]` undefined.
    // The function should survive this gracefully and return currentStreak = 1.
    const calendar = buildCalendar([1]);

    // We only assert it doesn't throw and that the counts make sense.
    expect(() => calculateStreak(calendar)).not.toThrow();
    const result = calculateStreak(calendar);
    expect(result.totalContributions).toBe(1);
    expect(result.longestStreak).toBe(1);
  });
});
