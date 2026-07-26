import { describe, it, expect } from 'vitest';
import {
  aggregateCalendars,
  calculateMonthlyStats,
  calculateStreak,
  calculateWrappedStats,
  chunkDaysIntoWeeks,
} from './calculate';
import type { ContributionCalendar, ContributionDay } from '../types';

describe('calculate massive scaling behavior', () => {
  it('aggregateCalendars handles hundreds of calendars with thousands of contribution days', () => {
    const calendars: ContributionCalendar[] = Array.from({ length: 200 }, (_, calIndex) => ({
      totalContributions: 1000,
      weeks: Array.from({ length: 20 }, (_, weekIndex) => ({
        contributionDays: Array.from({ length: 7 }, (_, dayIndex) => ({
          date: new Date(Date.UTC(2024, 0, weekIndex * 7 + dayIndex + 1))
            .toISOString()
            .split('T')[0],
          contributionCount: calIndex + 1,
        })),
      })),
    }));

    const result = aggregateCalendars(calendars);

    expect(result.totalContributions).toBe(200000);
    expect(result.weeks.length).toBeGreaterThan(0);

    const allDays = result.weeks.flatMap((w) => w.contributionDays);
    expect(allDays.length).toBeGreaterThan(100);
  });

  it('calculateStreak correctly processes very large calendars', () => {
    const startDate = new Date('2000-01-01');

    const days: ContributionDay[] = Array.from({ length: 20000 }, (_, i) => ({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contributionCount: 1,
    }));

    const calendar: ContributionCalendar = {
      totalContributions: 20000,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'UTC', new Date(days[days.length - 1].date));

    expect(result.longestStreak).toBe(20000);
    expect(result.currentStreak).toBeGreaterThan(0);
    expect(result.totalContributions).toBe(20000);
  });

  it('calculateMonthlyStats handles extreme contribution counts without overflow', () => {
    const currentMonth = '2024-06';
    const previousMonth = '2024-05';

    const days: ContributionDay[] = [
      ...Array.from({ length: 30 }, (_, i) => ({
        date: `${previousMonth}-${String(i + 1).padStart(2, '0')}`,
        contributionCount: 1_000_000,
      })),
      ...Array.from({ length: 30 }, (_, i) => ({
        date: `${currentMonth}-${String(i + 1).padStart(2, '0')}`,
        contributionCount: 2_000_000,
      })),
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 90_000_000,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateMonthlyStats(calendar, 'UTC', new Date('2024-06-30T12:00:00Z'));

    expect(result.currentMonthTotal).toBe(60_000_000);
    expect(result.previousMonthTotal).toBe(30_000_000);
    expect(result.deltaAbsolute).toBe(30_000_000);
  });

  it('chunkDaysIntoWeeks preserves all entries for massive datasets', () => {
    const startDate = new Date('2020-01-01');

    const days: ContributionDay[] = Array.from({ length: 15000 }, (_, i) => ({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contributionCount: i % 50,
    }));

    const weeks = chunkDaysIntoWeeks(days);

    const reconstructed = weeks.flatMap((week) => week.contributionDays);

    expect(reconstructed.length).toBe(days.length);
    expect(weeks.length).toBeGreaterThan(2000);
  });

  it('calculateWrappedStats remains performant and accurate on massive datasets', () => {
    const startDate = new Date('2022-01-01');

    const days: ContributionDay[] = Array.from({ length: 10000 }, (_, i) => ({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contributionCount: (i % 100) + 1,
    }));

    const calendar: ContributionCalendar = {
      totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
      weeks: chunkDaysIntoWeeks(days),
    };

    const start = performance.now();

    const stats = calculateWrappedStats(calendar);

    const duration = performance.now() - start;

    expect(stats.totalContributions).toBe(calendar.totalContributions);
    expect(stats.highestDailyCount).toBe(100);
    expect(stats.mostActiveDate).not.toBe('N/A');
    expect(stats.busiestMonth).not.toBe('N/A');
    expect(duration).toBeLessThan(1000);
  });
});
