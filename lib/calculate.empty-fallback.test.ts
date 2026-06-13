/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import {
  isStreakAlive,
  findTodayIndex,
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
  chunkDaysIntoWeeks,
  calculateWrappedStats,
} from './calculate';

describe('calculate-empty-fallback', () => {
  describe('isStreakAlive', () => {
    it('should return false when today is missing/null/undefined and yesterday is null/undefined/0', () => {
      expect(isStreakAlive(null, null)).toBe(false);
      expect(isStreakAlive(undefined, undefined)).toBe(false);
      expect(isStreakAlive(null, { contributionCount: 0 })).toBe(false);
    });

    it('should return true if today is missing but yesterday has contributionCount > 0', () => {
      expect(isStreakAlive(null, { contributionCount: 5 })).toBe(true);
      expect(isStreakAlive(undefined, { contributionCount: 1 })).toBe(true);
    });

    it('should return true if today is present and has contributionCount > 0', () => {
      expect(isStreakAlive({ contributionCount: 1 }, null)).toBe(true);
    });
  });

  describe('findTodayIndex', () => {
    it('should return -1 when days is null, undefined, or empty', () => {
      expect(findTodayIndex(null)).toBe(-1);
      expect(findTodayIndex(undefined)).toBe(-1);
      expect(findTodayIndex([])).toBe(-1);
    });

    it('should fallback to UTC and find today index successfully even with invalid timezone', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const days = [
        { date: '2026-06-11', contributionCount: 1 },
        { date: '2026-06-12', contributionCount: 2 },
        { date: '2026-06-13', contributionCount: 3 },
      ];
      // "Invalid/Timezone" should trigger catch block formatting to UTC (which gives 2026-06-12)
      const index = findTodayIndex(days, 'Invalid/Timezone', now);
      expect(index).toBe(1);
    });

    it('should safely skip null/undefined days in the days array', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const days = [null as any, undefined as any, { date: '2026-06-12', contributionCount: 2 }];
      const index = findTodayIndex(days, 'UTC', now);
      expect(index).toBe(2);
    });
  });

  describe('calculateStreak', () => {
    it('should return default StreakStats structure when calendar is null/undefined', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const expectedDate = '2026-06-12';

      const resultNull = calculateStreak(null, 'UTC', now);
      expect(resultNull).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: 0,
        todayDate: expectedDate,
      });

      const resultUndefined = calculateStreak(undefined, 'UTC', now);
      expect(resultUndefined).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: 0,
        todayDate: expectedDate,
      });
    });

    it('should handle missing weeks or null contributionDays safely', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const calendar = {
        totalContributions: 15,
        weeks: [
          { contributionDays: [null as any] },
          undefined as any,
          {
            contributionDays: [{ date: '2026-06-12', contributionCount: 3 }],
          },
        ],
      };

      const result = calculateStreak(calendar, 'UTC', now);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.totalContributions).toBe(15);
      expect(result.todayDate).toBe('2026-06-12');
    });

    it('should handle invalid timezone input gracefully and fallback to UTC', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const calendar = {
        totalContributions: 5,
        weeks: [
          {
            contributionDays: [{ date: '2026-06-12', contributionCount: 5 }],
          },
        ],
      };

      const result = calculateStreak(calendar, 'Invalid/Timezone', now);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.todayDate).toBe('2026-06-12');
    });
  });

  describe('calculateMonthlyStats', () => {
    it('should return empty/default MonthlyStats structure when calendar is null/undefined', () => {
      const now = new Date('2026-06-12T12:00:00Z');

      const resultNull = calculateMonthlyStats(null, 'UTC', now);
      expect(resultNull).toEqual({
        currentMonthTotal: 0,
        previousMonthTotal: 0,
        deltaPercentage: null,
        deltaAbsolute: 0,
        currentMonthName: 'June',
      });

      const resultUndefined = calculateMonthlyStats(undefined, 'UTC', now);
      expect(resultUndefined).toEqual({
        currentMonthTotal: 0,
        previousMonthTotal: 0,
        deltaPercentage: null,
        deltaAbsolute: 0,
        currentMonthName: 'June',
      });
    });

    it('should gracefully handle empty weeks or contributionDays list', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const calendar = {
        totalContributions: 0,
        weeks: [],
      };

      const result = calculateMonthlyStats(calendar, 'UTC', now);
      expect(result).toEqual({
        currentMonthTotal: 0,
        previousMonthTotal: 0,
        deltaPercentage: null,
        deltaAbsolute: 0,
        currentMonthName: 'June',
      });
    });

    it('should handle invalid timezones safely', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const calendar = {
        totalContributions: 0,
        weeks: [],
      };

      const result = calculateMonthlyStats(calendar, 'Invalid/Timezone', now);
      expect(result.currentMonthName).toBe('June');
    });

    it('should handle days with null fields or missing contribution count', () => {
      const now = new Date('2026-06-12T12:00:00Z');
      const calendar = {
        totalContributions: 5,
        weeks: [
          {
            contributionDays: [
              { date: '2026-06-12', contributionCount: null as any },
              { date: '2026-05-12', contributionCount: undefined as any },
              null as any,
            ],
          },
        ],
      };

      const result = calculateMonthlyStats(calendar, 'UTC', now);
      expect(result.currentMonthTotal).toBe(0);
      expect(result.previousMonthTotal).toBe(0);
      expect(result.deltaAbsolute).toBe(0);
    });
  });

  describe('aggregateCalendars', () => {
    it('should return empty calendar structure when parameter is null, undefined, or empty array', () => {
      expect(aggregateCalendars(null)).toEqual({ totalContributions: 0, weeks: [] });
      expect(aggregateCalendars(undefined)).toEqual({ totalContributions: 0, weeks: [] });
      expect(aggregateCalendars([])).toEqual({ totalContributions: 0, weeks: [] });
    });

    it('should safely filter out null/undefined calendar entries and proceed', () => {
      const calendars = [
        null as any,
        {
          totalContributions: 10,
          weeks: [
            {
              contributionDays: [{ date: '2026-06-12', contributionCount: 10 }],
            },
          ],
        },
        undefined as any,
      ];

      const result = aggregateCalendars(calendars);
      expect(result.totalContributions).toBe(10);
      expect(result.weeks[0].contributionDays[0]).toEqual({
        date: '2026-06-12',
        contributionCount: 10,
      });
    });

    it('should handle incomplete weeks and contribution days', () => {
      const calendars = [
        {
          totalContributions: 5,
          weeks: [
            {
              contributionDays: [
                null as any,
                { date: '2026-06-11', contributionCount: null as any },
              ],
            },
          ],
        },
      ];
      const result = aggregateCalendars(calendars);
      expect(result.totalContributions).toBe(5);
    });
  });

  describe('chunkDaysIntoWeeks', () => {
    it('should return empty array when parameter is null, undefined, or empty', () => {
      expect(chunkDaysIntoWeeks(null)).toEqual([]);
      expect(chunkDaysIntoWeeks(undefined)).toEqual([]);
      expect(chunkDaysIntoWeeks([])).toEqual([]);
    });

    it('should skip null values, missing dates, or invalid date values without throwing errors', () => {
      const days = [
        null as any,
        { date: '', contributionCount: 5 },
        { date: 'invalid-date-format', contributionCount: 3 },
        { date: '2026-06-08', contributionCount: 1 }, // Monday
        { date: '2026-06-09', contributionCount: 2 }, // Tuesday
      ];

      const result = chunkDaysIntoWeeks(days);
      expect(result.length).toBe(1);
      expect(result[0].contributionDays.length).toBe(2);
      expect(result[0].contributionDays[0].date).toBe('2026-06-08');
      expect(result[0].contributionDays[1].date).toBe('2026-06-09');
    });
  });

  describe('calculateWrappedStats', () => {
    it('should return default wrapped stats structure when calendar is null/undefined', () => {
      const expected = {
        totalContributions: 0,
        mostActiveDate: 'N/A',
        highestDailyCount: 0,
        busiestMonth: 'N/A',
        weekendRatio: 0,
      };

      expect(calculateWrappedStats(null)).toEqual(expected);
      expect(calculateWrappedStats(undefined)).toEqual(expected);
    });

    it('should return default values when calendar has empty or invalid weeks/days structure', () => {
      const calendar = {
        totalContributions: 10,
        weeks: [
          {
            contributionDays: [null as any, { date: 'invalid-date', contributionCount: 5 }],
          },
        ],
      };

      const result = calculateWrappedStats(calendar);
      expect(result).toEqual({
        totalContributions: 10,
        mostActiveDate: 'N/A',
        highestDailyCount: 0,
        busiestMonth: 'N/A',
        weekendRatio: 0,
      });
    });

    it('should process valid and partially invalid mixed days correctly', () => {
      const calendar = {
        totalContributions: 15,
        weeks: [
          {
            contributionDays: [
              { date: '2026-06-07', contributionCount: 5 }, // Sunday (weekend)
              { date: '2026-06-08', contributionCount: 10 }, // Monday (weekday)
              { date: 'invalid-date', contributionCount: 100 },
            ],
          },
        ],
      };

      const result = calculateWrappedStats(calendar);
      expect(result.totalContributions).toBe(15);
      expect(result.mostActiveDate).toBe('2026-06-08');
      expect(result.highestDailyCount).toBe(10);
      expect(result.busiestMonth).toBe('2026-06');
      // weekendRatio = 5 / (5 + 10) * 100 = 33%
      expect(result.weekendRatio).toBe(33);
    });
  });
});
