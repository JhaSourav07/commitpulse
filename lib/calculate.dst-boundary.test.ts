import { describe, expect, it } from 'vitest';
import { calculateStreak, getLocalTodayStr, chunkDaysIntoWeeks } from './calculate';
import type { ContributionCalendar, ContributionDay } from '../types';

describe('calculate DST boundary behavior', () => {
  it('preserves streak across US spring-forward transition', () => {
    const days: ContributionDay[] = [
      { date: '2024-03-08', contributionCount: 1 },
      { date: '2024-03-09', contributionCount: 1 },
      { date: '2024-03-10', contributionCount: 1 },
      { date: '2024-03-11', contributionCount: 1 },
      { date: '2024-03-12', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'America/New_York', new Date('2024-03-12T12:00:00Z'));

    expect(result.longestStreak).toBe(5);
  });

  it('preserves streak across US fall-back transition', () => {
    const days: ContributionDay[] = [
      { date: '2024-10-31', contributionCount: 1 },
      { date: '2024-11-01', contributionCount: 1 },
      { date: '2024-11-02', contributionCount: 1 },
      { date: '2024-11-03', contributionCount: 1 },
      { date: '2024-11-04', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'America/New_York', new Date('2024-11-04T12:00:00Z'));

    expect(result.longestStreak).toBe(5);
  });

  it('preserves streak across UK spring-forward transition', () => {
    const days: ContributionDay[] = [
      { date: '2024-03-29', contributionCount: 1 },
      { date: '2024-03-30', contributionCount: 1 },
      { date: '2024-03-31', contributionCount: 1 },
      { date: '2024-04-01', contributionCount: 1 },
      { date: '2024-04-02', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'Europe/London', new Date('2024-04-02T12:00:00Z'));

    expect(result.longestStreak).toBe(5);
  });

  it('preserves streak across UK fall-back transition', () => {
    const days: ContributionDay[] = [
      { date: '2024-10-24', contributionCount: 1 },
      { date: '2024-10-25', contributionCount: 1 },
      { date: '2024-10-26', contributionCount: 1 },
      { date: '2024-10-27', contributionCount: 1 },
      { date: '2024-10-28', contributionCount: 1 },
    ];

    const calendar: ContributionCalendar = {
      totalContributions: 5,
      weeks: chunkDaysIntoWeeks(days),
    };

    const result = calculateStreak(calendar, 'Europe/London', new Date('2024-10-28T12:00:00Z'));

    expect(result.longestStreak).toBe(5);
  });

  it('returns the same local date across a DST clock change', () => {
    const before = getLocalTodayStr(new Date('2024-03-10T06:59:59Z'), 'America/New_York');

    const after = getLocalTodayStr(new Date('2024-03-10T07:00:01Z'), 'America/New_York');

    expect(before).toBe('2024-03-10');
    expect(after).toBe('2024-03-10');
  });
});
