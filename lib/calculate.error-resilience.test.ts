import { describe, it, expect, vi } from 'vitest';
import type { ContributionCalendar } from '../types';
import {
  convertLocalToUtc,
  getLocalTodayStr,
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
} from './calculate';

describe('calculate-error-resilience', () => {
  it('should gracefully fallback to UTC when Intl.DateTimeFormat throws in convertLocalToUtc', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl failed');
    });

    try {
      const result = convertLocalToUtc(2026, 6, 12, 10, 0, 0, 'Asia/Kolkata');

      expect(result).toBe('2026-06-12T10:00:00Z');
    } finally {
      spy.mockRestore();
    }
  });

  it('should fallback safely when Intl formatter crashes inside getLocalTodayStr', () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('formatter failed');
    });

    try {
      const result = getLocalTodayStr(new Date('2026-06-12T00:00:00Z'), 'Asia/Kolkata');

      expect(result).toBe('2026-06-12');
    } finally {
      spy.mockRestore();
    }
  });

  it('should not throw for malformed calendar in calculateStreak', () => {
    const calendar = {
      totalContributions: 10,
      weeks: [undefined, { contributionDays: [null] }],
    } as unknown as Parameters<typeof calculateStreak>[0];

    const now = new Date('2026-06-12T12:00:00Z');

    const result = calculateStreak(calendar, 'UTC', now);

    expect(result.totalContributions).toBe(10);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.todayDate).toBe('2026-06-12');
  });

  it('should not throw for malformed calendar in calculateMonthlyStats', () => {
    const calendar = {
      totalContributions: 10,
      weeks: [null],
    } as unknown as Parameters<typeof calculateMonthlyStats>[0];

    const now = new Date('2026-06-12T12:00:00Z');

    const result = calculateMonthlyStats(calendar, 'Invalid/Timezone', now);

    expect(result.currentMonthTotal).toBe(0);
    expect(result.previousMonthTotal).toBe(0);
    expect(result.deltaAbsolute).toBe(0);
    expect(result.deltaPercentage).toBeNull();
  });

  it('should safely ignore invalid calendar entries in aggregateCalendars', () => {
    const result = aggregateCalendars([
      {
        totalContributions: 5,
        weeks: [],
      } as ContributionCalendar,

      null as unknown as ContributionCalendar,

      undefined as unknown as ContributionCalendar,
    ]);

    expect(result.totalContributions).toBe(5);
    expect(result.weeks).toEqual([]);
  });
});
