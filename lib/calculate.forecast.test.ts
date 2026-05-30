// lib/calculate.forecast.test.ts

import { describe, it, expect } from 'vitest';
import { calculateForecast } from './calculate';
import type { ContributionCalendar } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Builds a ContributionCalendar from a flat array of { date, count } pairs,
 * grouping into weeks of 7 (same structure as the GitHub GraphQL API).
 */
function buildCalendar(days: Array<{ date: string; count: number }>): ContributionCalendar {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    weeks.push({
      contributionDays: slice.map((d) => ({
        contributionCount: d.count,
        date: d.date,
      })),
    });
  }
  return {
    totalContributions: days.reduce((s, d) => s + d.count, 0),
    weeks,
  };
}

/**
 * Generates an array of consecutive date strings starting from `startDate`.
 */
function dateRange(startDate: string, numDays: number): string[] {
  const result: string[] = [];
  const start = new Date(startDate + 'T12:00:00Z');
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

/**
 * Builds a calendar with a fixed daily contribution count for every day.
 */
function buildFlatCalendar(
  startDate: string,
  numDays: number,
  countPerDay: number
): ContributionCalendar {
  const dates = dateRange(startDate, numDays);
  return buildCalendar(dates.map((date) => ({ date, count: countPerDay })));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('calculateForecast', () => {
  it('returns ForecastData with the correct shape', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    // 90 days of data ending on 2024-06-15
    const startDate = '2024-03-17';
    const calendar = buildFlatCalendar(startDate, 91, 3);

    const result = calculateForecast(calendar, now);

    expect(result).toHaveProperty('next7Days');
    expect(result).toHaveProperty('endOfMonthProjection');
    expect(result).toHaveProperty('yearEndProjection');
    expect(result).toHaveProperty('dailyAverage');
    expect(result).toHaveProperty('currentMonthActual');
    expect(result).toHaveProperty('daysLeftInMonth');
    expect(result).toHaveProperty('yearToDateActual');

    expect(result.next7Days).toHaveLength(7);
    expect(result.next7Days[0]).toHaveProperty('date');
    expect(result.next7Days[0]).toHaveProperty('dayLabel');
    expect(result.next7Days[0]).toHaveProperty('predicted');
  });

  it('next7Days starts from tomorrow, not today', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const calendar = buildFlatCalendar('2024-03-17', 91, 2);

    const result = calculateForecast(calendar, now);

    // First forecast day should be 2024-06-16 (tomorrow)
    expect(result.next7Days[0].date).toBe('2024-06-16');
    // Last forecast day should be 2024-06-22
    expect(result.next7Days[6].date).toBe('2024-06-22');
  });

  it('next7Days predicted values are non-negative integers', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const calendar = buildFlatCalendar('2024-03-17', 91, 5);

    const result = calculateForecast(calendar, now);

    for (const day of result.next7Days) {
      expect(day.predicted).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(day.predicted)).toBe(true);
    }
  });

  it('next7Days has correct day labels for each date', () => {
    const now = new Date('2024-06-17T12:00:00Z'); // Monday
    const calendar = buildFlatCalendar('2024-03-19', 91, 3);

    const result = calculateForecast(calendar, now);

    // 2024-06-18 = Tuesday
    expect(result.next7Days[0].dayLabel).toBe('Tue');
    // 2024-06-22 = Saturday
    expect(result.next7Days[4].dayLabel).toBe('Sat');
    // 2024-06-23 = Sunday
    expect(result.next7Days[5].dayLabel).toBe('Sun');
  });

  it('returns zero forecast for a user with zero contributions', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const calendar = buildFlatCalendar('2024-03-17', 91, 0);

    const result = calculateForecast(calendar, now);

    expect(result.dailyAverage).toBe(0);
    for (const day of result.next7Days) {
      expect(day.predicted).toBe(0);
    }
    expect(result.endOfMonthProjection).toBe(0);
    expect(result.yearEndProjection).toBe(0);
  });

  it('endOfMonthProjection >= currentMonthActual', () => {
    const now = new Date('2024-06-15T12:00:00Z'); // Mid-month
    const calendar = buildFlatCalendar('2024-03-17', 91, 4);

    const result = calculateForecast(calendar, now);

    // There are still days left in June, so projection must be >= actual
    expect(result.endOfMonthProjection).toBeGreaterThanOrEqual(result.currentMonthActual);
  });

  it('endOfMonthProjection equals currentMonthActual on the last day of the month', () => {
    // June 30 = last day; daysLeftInMonth = 0
    const now = new Date('2024-06-30T12:00:00Z');
    const calendar = buildFlatCalendar('2024-04-01', 91, 5);

    const result = calculateForecast(calendar, now);

    expect(result.daysLeftInMonth).toBe(0);
    expect(result.endOfMonthProjection).toBe(result.currentMonthActual);
  });

  it('yearEndProjection >= yearToDateActual', () => {
    const now = new Date('2024-06-15T12:00:00Z'); // Mid-year
    const calendar = buildFlatCalendar('2024-01-01', 167, 3);

    const result = calculateForecast(calendar, now);

    expect(result.yearEndProjection).toBeGreaterThanOrEqual(result.yearToDateActual);
  });

  it('currentMonthActual only counts contributions in the current month', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    // 90 days: May has ~31 days, June up to the 15th = 15 days
    // 31 days of May (3/day) + 15 days of June (3/day) = totals
    const days = [
      ...dateRange('2024-03-17', 45).map((date) => ({ date, count: 1 })), // March-April
      ...dateRange('2024-05-01', 31).map((date) => ({ date, count: 5 })), // May: 5/day
      ...dateRange('2024-06-01', 15).map((date) => ({ date, count: 7 })), // June 1-15: 7/day
    ];
    const calendar = buildCalendar(days);

    const result = calculateForecast(calendar, now);

    // currentMonthActual = 15 days × 7 = 105
    expect(result.currentMonthActual).toBe(105);
  });

  it('weekday predictions are higher than weekend predictions for active users', () => {
    const now = new Date('2024-06-14T12:00:00Z'); // Friday
    // High activity user: 10 contributions/day
    const calendar = buildFlatCalendar('2024-03-16', 91, 10);

    const result = calculateForecast(calendar, now);

    // next7Days[0] = Saturday (weekend), next7Days[2] = Monday (weekday)
    const saturday = result.next7Days[0]; // 2024-06-15 = Sat
    const monday = result.next7Days[2]; // 2024-06-17 = Mon

    expect(saturday.dayLabel).toBe('Sat');
    expect(monday.dayLabel).toBe('Mon');

    // Weekday (Mon) should be predicted higher than weekend (Sat)
    expect(monday.predicted).toBeGreaterThan(saturday.predicted);
  });

  it('dailyAverage is the rolling 30-day mean, rounded to 1 decimal place', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    // Last 30 days all have exactly 6 contributions
    const days = [
      ...dateRange('2024-04-01', 45).map((date) => ({ date, count: 2 })),
      ...dateRange('2024-05-16', 30).map((date) => ({ date, count: 6 })), // last 30 days
    ];
    const calendar = buildCalendar(days);

    const result = calculateForecast(calendar, now);

    // Rolling 30-day average of 6 = 6.0
    expect(result.dailyAverage).toBe(6.0);
  });

  it('handles an empty calendar gracefully', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const emptyCalendar: ContributionCalendar = { totalContributions: 0, weeks: [] };

    const result = calculateForecast(emptyCalendar, now);

    expect(result.dailyAverage).toBe(0);
    expect(result.next7Days).toHaveLength(7);
    expect(result.endOfMonthProjection).toBe(0);
    expect(result.yearEndProjection).toBe(0);
    expect(result.currentMonthActual).toBe(0);
    expect(result.yearToDateActual).toBe(0);
  });

  it('produces deterministic output for the same inputs', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const calendar = buildFlatCalendar('2024-03-17', 91, 4);

    const result1 = calculateForecast(calendar, now);
    const result2 = calculateForecast(calendar, now);

    expect(result1).toEqual(result2);
  });
});
