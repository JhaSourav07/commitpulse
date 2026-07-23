import { describe, it, expect } from 'vitest';
import { calculateStreak } from './calculate';
import type { ContributionCalendar } from '../types';

// Helper to construct a ContributionCalendar with explicit dates
const buildCustomCalendar = (daysData: { date: string; count: number }[]): ContributionCalendar => {
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

describe('calculateStreak — empty contribution calendar timeline (Variation 3)', () => {
  it('handles a completely empty calendar structure (weeks: []) cleanly returning zero streaks', () => {
    const calendar: ContributionCalendar = {
      totalContributions: 0,
      weeks: [],
    };

    const result = calculateStreak(calendar, 'UTC', new Date('2026-06-05T12:00:00Z'));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.todayDate).toBe('2026-06-05');
  });

  it('yields zero for both current and longest streaks when calendar has a single day of 0 contributions', () => {
    const calendar = buildCustomCalendar([{ date: '2026-06-05', count: 0 }]);

    const result = calculateStreak(calendar, 'UTC', new Date('2026-06-05T12:00:00Z'));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.todayDate).toBe('2026-06-05');
  });

  it('yields zero streaks on a multi-week calendar with all empty days', () => {
    const daysData = [];
    // Generate 14 empty days (2 weeks)
    const startDate = new Date('2026-05-20');
    for (let i = 0; i < 14; i++) {
      const dateStr = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      daysData.push({ date: dateStr, count: 0 });
    }
    const calendar = buildCustomCalendar(daysData);

    const result = calculateStreak(calendar, 'UTC', new Date('2026-06-02T12:00:00Z'));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.todayDate).toBe('2026-06-02');
  });

  it('handles a stale empty calendar without errors when today is after the last calendar date', () => {
    const calendar = buildCustomCalendar([
      { date: '2026-05-01', count: 0 },
      { date: '2026-05-02', count: 0 },
    ]);

    // Today is 2026-06-05, calendar ends on 2026-05-02.
    // All contributions are 0, so currentStreak=0. todayDate falls back to localTodayStr.
    const result = calculateStreak(calendar, 'UTC', new Date('2026-06-05T12:00:00Z'));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(0);
    expect(result.todayDate).toBe('2026-06-05');
  });

  it('degrades gracefully to zero streaks when weeks array is undefined or null', () => {
    const calendar = {
      totalContributions: 10, // Supposedly some contributions but weeks is undefined
    } as unknown as ContributionCalendar;

    const result = calculateStreak(calendar, 'UTC', new Date('2026-06-05T12:00:00Z'));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalContributions).toBe(10);
    expect(result.todayDate).toBe('2026-06-05');
  });
});
