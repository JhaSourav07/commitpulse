import { describe, test, expectTypeOf } from 'vitest';
import type { ContributionCalendar, ContributionDay, StreakStats, MonthlyStats } from '../types';
import {
  isLeapYear,
  daysInYear,
  calculateSafePercentage,
  convertLocalToUtc,
  getLocalTodayStr,
  isStreakAlive,
  findTodayIndex,
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
  chunkDaysIntoWeeks,
  calculateWrappedStats,
  normalizeCalendarToTimezone,
} from './calculate';

describe('TypeScript Compiler Validation & Schema Constraints Stability (lib/calculate)', () => {
  // Test Case 1: Enforce field property configurations & strict types for inputs
  test('should enforce strict property configurations for calculation inputs', () => {
    // Verify utility parameters expect specific types
    expectTypeOf(isLeapYear).parameters.toEqualTypeOf<[year: number]>();
    expectTypeOf(daysInYear).parameters.toEqualTypeOf<[year: number]>();
    expectTypeOf(calculateSafePercentage).parameters.toEqualTypeOf<[part: number, total: number]>();

    // Verify function parameter array mappings matching implementation
    expectTypeOf(chunkDaysIntoWeeks).parameters.toEqualTypeOf<
      [days?: ContributionDay[] | null | undefined]
    >();
  });

  // Test Case 2: Verify custom types accept optional values without compile errors
  test('should verify optional parameters accept undefined or null gracefully', () => {
    // calculateStreak accepts optional calendar (can be null/undefined) and optional strings/Dates/numbers
    expectTypeOf(calculateStreak).parameters.toEqualTypeOf<
      [
        calendar?: ContributionCalendar | null | undefined,
        timezone?: string,
        now?: Date,
        grace?: number,
      ]
    >();

    // calculateMonthlyStats accepts optional calendar, timezone, and now
    expectTypeOf(calculateMonthlyStats).parameters.toEqualTypeOf<
      [calendar?: ContributionCalendar | null | undefined, timezone?: string, now?: Date]
    >();
  });

  // Test Case 3: Assert that invalid prop parameters are blocked during static type checking
  test('should block invalid property parameters during compilation', () => {
    // Assert that string inputs cannot be given to isLeapYear or daysInYear parameters
    expectTypeOf<string>().not.toMatchTypeOf<Parameters<typeof isLeapYear>[0]>();
    expectTypeOf<string>().not.toMatchTypeOf<Parameters<typeof daysInYear>[0]>();

    // Assert that invalid object variants cannot be assigned to return structures like StreakStats
    expectTypeOf<{ invalidField: string }>().not.toMatchTypeOf<StreakStats>();
    expectTypeOf<{ currentStreak: string }>().not.toMatchTypeOf<StreakStats>();
  });

  // Test Case 4: Verify return type safety stability
  test('should enforce strict return type stability for calculations', () => {
    // Verify primitive utility returns
    expectTypeOf(isLeapYear).returns.toBeBoolean();
    expectTypeOf(daysInYear).returns.toBeNumber();
    expectTypeOf(calculateSafePercentage).returns.toBeNumber();
    expectTypeOf(convertLocalToUtc).returns.toBeString();
    expectTypeOf(getLocalTodayStr).returns.toBeString();
    expectTypeOf(isStreakAlive).returns.toBeBoolean();
    expectTypeOf(findTodayIndex).returns.toBeNumber();

    // Verify structural object returns match expected module interfaces
    expectTypeOf(calculateStreak).returns.toEqualTypeOf<StreakStats>();
    expectTypeOf(calculateMonthlyStats).returns.toEqualTypeOf<MonthlyStats>();
    expectTypeOf(aggregateCalendars).returns.toEqualTypeOf<ContributionCalendar>();
    expectTypeOf(normalizeCalendarToTimezone).returns.toEqualTypeOf<ContributionCalendar>();
  });

  // Test Case 5: Verify structured outputs for aggregated features (Wrapped Stats Layout)
  test('should assert strict structure constraints on wrapped statistics report', () => {
    type WrappedStats = ReturnType<typeof calculateWrappedStats>;

    // Enforce that the structural breakdown matches the precise layout requirements
    expectTypeOf<WrappedStats>().toHaveProperty('totalContributions');
    expectTypeOf<WrappedStats['totalContributions']>().toBeNumber();

    expectTypeOf<WrappedStats>().toHaveProperty('mostActiveDate');
    expectTypeOf<WrappedStats['mostActiveDate']>().toBeString();

    expectTypeOf<WrappedStats>().toHaveProperty('highestDailyCount');
    expectTypeOf<WrappedStats['highestDailyCount']>().toBeNumber();

    expectTypeOf<WrappedStats>().toHaveProperty('busiestMonth');
    expectTypeOf<WrappedStats['busiestMonth']>().toBeString();

    expectTypeOf<WrappedStats>().toHaveProperty('weekendRatio');
    expectTypeOf<WrappedStats['weekendRatio']>().toBeNumber();
  });
});
