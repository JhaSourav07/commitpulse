import { describe, it, expect } from 'vitest';
import { calculateStreak } from './calculate';
import type { ContributionCalendar, ContributionDay } from '../types';

function buildCalendar(days: ContributionDay[]): ContributionCalendar {
  return {
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    weeks: [
      {
        contributionDays: days,
      },
    ],
  };
}

describe('calculateStreak - unsorted calendar handling', () => {
  it('produces identical results for reversed date order', () => {
    const ordered: ContributionDay[] = [
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 1 },
      { date: '2024-01-03', contributionCount: 1 },
      { date: '2024-01-04', contributionCount: 1 },
      { date: '2024-01-05', contributionCount: 1 },
    ];

    const reversed = [...ordered].reverse();

    const orderedResult = calculateStreak(buildCalendar(ordered));
    const reversedResult = calculateStreak(buildCalendar(reversed));

    expect(reversedResult.currentStreak).toBe(orderedResult.currentStreak);
    expect(reversedResult.longestStreak).toBe(orderedResult.longestStreak);
  });

  it('handles shuffled contribution days correctly', () => {
    const shuffled: ContributionDay[] = [
      { date: '2024-01-03', contributionCount: 1 },
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-05', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 1 },
      { date: '2024-01-04', contributionCount: 1 },
    ];

    const result = calculateStreak(
      buildCalendar(shuffled),
      'UTC',
      new Date('2024-01-05T12:00:00Z')
    );

    expect(result.longestStreak).toBe(5);
    expect(result.currentStreak).toBe(5);
  });

  it('ignores duplicate dates in unsorted input', () => {
    const days: ContributionDay[] = [
      { date: '2024-01-03', contributionCount: 1 },
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 1 },
      { date: '2024-01-03', contributionCount: 1 },
    ];

    const result = calculateStreak(buildCalendar(days), 'UTC', new Date('2024-01-03T12:00:00Z'));

    expect(result.longestStreak).toBe(3);
    expect(result.currentStreak).toBe(3);
  });

  it('preserves streak calculations across mixed week ordering', () => {
    const calendar: ContributionCalendar = {
      totalContributions: 6,
      weeks: [
        {
          contributionDays: [
            { date: '2024-01-04', contributionCount: 1 },
            { date: '2024-01-05', contributionCount: 1 },
            { date: '2024-01-06', contributionCount: 1 },
          ],
        },
        {
          contributionDays: [
            { date: '2024-01-01', contributionCount: 1 },
            { date: '2024-01-02', contributionCount: 1 },
            { date: '2024-01-03', contributionCount: 1 },
          ],
        },
      ],
    };

    const result = calculateStreak(calendar, 'UTC', new Date('2024-01-06T12:00:00Z'));

    expect(result.longestStreak).toBe(6);
    expect(result.currentStreak).toBe(6);
  });

  it('returns deterministic results regardless of input ordering', () => {
    const ordered: ContributionDay[] = [
      { date: '2024-01-01', contributionCount: 1 },
      { date: '2024-01-02', contributionCount: 1 },
      { date: '2024-01-03', contributionCount: 0 },
      { date: '2024-01-04', contributionCount: 1 },
      { date: '2024-01-05', contributionCount: 1 },
    ];

    const shuffled: ContributionDay[] = [
      ordered[4],
      ordered[1],
      ordered[3],
      ordered[0],
      ordered[2],
    ];

    const resultA = calculateStreak(
      buildCalendar(ordered),
      'UTC',
      new Date('2024-01-05T12:00:00Z')
    );

    const resultB = calculateStreak(
      buildCalendar(shuffled),
      'UTC',
      new Date('2024-01-05T12:00:00Z')
    );

    expect(resultB.currentStreak).toBe(resultA.currentStreak);
    expect(resultB.longestStreak).toBe(resultA.longestStreak);
    expect(resultB.totalContributions).toBe(resultA.totalContributions);
  });
});
