import { describe, it, expect } from 'vitest';
import { calculateStreak, chunkDaysIntoWeeks } from './calculate';
import type { ContributionCalendar, ContributionDay } from '../types';

describe('calculate multiyear scaling behavior', () => {
  it('maintains a continuous streak across multiple years', () => {
    const start = new Date('2015-01-01');

    const days: ContributionDay[] = Array.from({ length: 3650 }, (_, i) => ({
      date: new Date(start.getTime() + i * 86400000).toISOString().split('T')[0],
      contributionCount: 1,
    }));

    const calendar: ContributionCalendar = {
      totalContributions: days.length,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'UTC', new Date(days[days.length - 1].date));

    expect(result.longestStreak).toBe(3650);
    expect(result.currentStreak).toBeGreaterThan(0);
  });

  it('correctly handles leap year continuity through February 29', () => {
    const days: ContributionDay[] = [
      { date: '2024-02-27', contributionCount: 1 },
      { date: '2024-02-28', contributionCount: 1 },
      { date: '2024-02-29', contributionCount: 1 },
      { date: '2024-03-01', contributionCount: 1 },
      { date: '2024-03-02', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'UTC', new Date('2024-03-02'));

    expect(result.longestStreak).toBe(5);
  });

  it('preserves streaks across December to January year boundaries', () => {
    const days: ContributionDay[] = [
      { date: '2024-12-29', contributionCount: 1 },
      { date: '2024-12-30', contributionCount: 1 },
      { date: '2024-12-31', contributionCount: 1 },
      { date: '2025-01-01', contributionCount: 1 },
      { date: '2025-01-02', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'UTC', new Date('2025-01-02'));

    expect(result.longestStreak).toBe(5);
  });

  it('remains accurate under timezone-sensitive date boundaries', () => {
    const days: ContributionDay[] = [
      { date: '2025-01-01', contributionCount: 1 },
      { date: '2025-01-02', contributionCount: 1 },
      { date: '2025-01-03', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 3,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'Asia/Kolkata', new Date('2025-01-03T23:30:00Z'));

    expect(result.longestStreak).toBe(3);
  });

  it('handles decade-scale histories with intermittent gaps', () => {
    const start = new Date('2010-01-01');

    const days: ContributionDay[] = Array.from({ length: 3650 }, (_, i) => ({
      date: new Date(start.getTime() + i * 86400000).toISOString().split('T')[0],
      contributionCount: i % 500 === 0 ? 0 : 1,
    }));

    const calendar: ContributionCalendar = {
      totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'UTC', new Date(days[days.length - 1].date));

    expect(result.longestStreak).toBeGreaterThan(100);
    expect(result.totalContributions).toBeGreaterThan(0);
  });
});
