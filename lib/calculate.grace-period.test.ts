import { describe, it, expect } from 'vitest'; // swap for '@jest/globals' if the repo uses Jest
import { calculateStreak } from './calculate';
import type { ContributionCalendar } from '../types';

/**
 * Regression test for the dead-code bug in calculateStreak():
 * a redundant `todayIndex = lastIndex;` line previously overwrote the
 * gap > grace check, so a streak never reset even when the user's last
 * contribution was far outside the grace period.
 */
describe('calculateStreak — grace period gap handling', () => {
  function buildCalendarEndingDaysAgo(daysAgo: number, streakLength: number): ContributionCalendar {
    const days = [];
    const today = new Date('2026-07-10T00:00:00Z');
    const lastContributionDate = new Date(today.getTime() - daysAgo * 86400000);

    for (let i = streakLength - 1; i >= 0; i--) {
      const d = new Date(lastContributionDate.getTime() - i * 86400000);
      days.push({
        date: d.toISOString().split('T')[0],
        contributionCount: 3,
      });
    }

    return {
      totalContributions: streakLength * 3,
      weeks: [{ contributionDays: days }],
    };
  }

  it('resets currentStreak to 0 when the gap since the last contribution exceeds the grace period', () => {
    const calendar = buildCalendarEndingDaysAgo(5, 4);
    const now = new Date('2026-07-10T12:00:00Z');

    const result = calculateStreak(calendar, 'UTC', now, 1);

    expect(result.currentStreak).toBe(0);
  });

  it('keeps the streak alive when the gap is within the grace period', () => {
    const calendar = buildCalendarEndingDaysAgo(1, 4);
    const now = new Date('2026-07-10T12:00:00Z');

    const result = calculateStreak(calendar, 'UTC', now, 1);

    expect(result.currentStreak).toBeGreaterThan(0);
  });
});
