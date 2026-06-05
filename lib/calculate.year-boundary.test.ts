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

describe('calculateStreak — year boundary transition timeline (Variation 1)', () => {
  it('counts a streak that spans the Dec 31 → Jan 1 boundary as one continuous run', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-28', count: 1 },
      { date: '2024-12-29', count: 1 },
      { date: '2024-12-30', count: 1 },
      { date: '2024-12-31', count: 1 }, // Year end
      { date: '2025-01-01', count: 1 }, // New year
      { date: '2025-01-02', count: 1 },
      { date: '2025-01-03', count: 1 },
    ]);

    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-03T12:00:00Z'));
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(7);
    expect(result.todayDate).toBe('2025-01-03');
  });

  it('resets the current streak but preserves the longest streak when a gap exists on Dec 31', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-28', count: 1 },
      { date: '2024-12-29', count: 1 },
      { date: '2024-12-30', count: 1 }, // Longest streak segment: 3 days
      { date: '2024-12-31', count: 0 }, // Gap on Dec 31
      { date: '2025-01-01', count: 1 }, // New streak starting Jan 1
    ]);

    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-01T12:00:00Z'), 1);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(3);
    expect(result.todayDate).toBe('2025-01-01');
  });

  it('handles year-end boundary transitions under different timezone offsets correctly', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-30', count: 1 },
      { date: '2024-12-31', count: 1 },
      { date: '2025-01-01', count: 1 },
    ]);

    const transitionTime = new Date('2024-12-31T20:00:00Z'); // 20:00 Dec 31 UTC, but 01:30 Jan 1 IST (UTC+5:30)

    // In UTC, today is 2024-12-31
    const resultUTC = calculateStreak(calendar, 'UTC', transitionTime);
    expect(resultUTC.todayDate).toBe('2024-12-31');
    expect(resultUTC.currentStreak).toBe(2); // Dec 30, Dec 31

    // In Asia/Kolkata, today is 2025-01-01
    const resultIST = calculateStreak(calendar, 'Asia/Kolkata', transitionTime);
    expect(resultIST.todayDate).toBe('2025-01-01');
    expect(resultIST.currentStreak).toBe(3); // Dec 30, Dec 31, Jan 1
  });

  it('correctly handles the year-end transition of a leap year without indexing anomalies', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-29', count: 1 },
      { date: '2024-12-30', count: 1 },
      { date: '2024-12-31', count: 1 }, // End of a leap year
      { date: '2025-01-01', count: 1 },
      { date: '2025-01-02', count: 1 },
    ]);

    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-02T12:00:00Z'));
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.todayDate).toBe('2025-01-02');
  });

  it('safely handles minimal calendar boundaries at the year-end transition without index out of bounds', () => {
    const calendar = buildCustomCalendar([
      { date: '2024-12-31', count: 1 },
      { date: '2025-01-01', count: 1 },
    ]);

    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-01T12:00:00Z'));
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.todayDate).toBe('2025-01-01');
  });
});
