import { afterEach, describe, expect, it, vi } from 'vitest';
import { Notification } from './Notification';
import { calculateMonthlyStats, calculateStreak, findTodayIndex } from '../lib/calculate';
import type { ContributionCalendar, ContributionDay } from '../types';

type TimezoneLabel = 'UTC' | 'America/New_York' | 'Asia/Kolkata' | 'Asia/Tokyo';

const ALLOWED_TIMEZONES: ReadonlySet<TimezoneLabel> = new Set([
  'UTC',
  'America/New_York',
  'Asia/Kolkata',
  'Asia/Tokyo',
]);

function buildCalendar(days: readonly ContributionDay[]): ContributionCalendar {
  return {
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    weeks: [
      {
        contributionDays: days.map((day) => ({ ...day })),
      },
    ],
  };
}

function formatCalendarDate(instant: Date, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(instant);
}

function getDatePartOrder(instant: Date, locale: string, timeZone: string): string[] {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(instant)
    .filter((part) => part.type !== 'literal')
    .map((part) => part.type);
}

function getTimezoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  ) as Record<string, string>;

  const zonedUtcTimestamp = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return Math.round((zonedUtcTimestamp - instant.getTime()) / 60000);
}

function normalizeTimezoneLabel(input: string | null | undefined): TimezoneLabel {
  if (typeof input !== 'string') {
    return 'UTC';
  }

  const normalized = input.trim();
  if (
    normalized.length === 0 ||
    normalized === '0' ||
    normalized === '+00:00' ||
    normalized === '-00:00'
  ) {
    return 'UTC';
  }

  return ALLOWED_TIMEZONES.has(normalized as TimezoneLabel) ? (normalized as TimezoneLabel) : 'UTC';
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});

describe('NotificationModel - Timezone Boundaries & Calendar Alignment', () => {
  it('maps commits onto the correct visual dates across UTC, EST, IST, and JST without boundary shifts', () => {
    const notification = new Notification({
      username: 'timezone-case-1',
      email: 'timezone-case-1@example.com',
      createdAt: new Date('2024-01-15T23:30:00.000Z'),
      updatedAt: new Date('2024-01-15T23:30:00.000Z'),
    });

    const calendar = buildCalendar([
      { date: '2024-01-14', contributionCount: 1 },
      { date: '2024-01-15', contributionCount: 1 },
      { date: '2024-01-16', contributionCount: 1 },
    ]);

    const instant = new Date('2024-01-15T23:30:00.000Z');
    const expectations: ReadonlyArray<{
      timeZone: TimezoneLabel;
      todayDate: string;
      currentStreak: number;
      expectedOffsetMinutes: number;
    }> = [
      { timeZone: 'UTC', todayDate: '2024-01-15', currentStreak: 2, expectedOffsetMinutes: 0 },
      {
        timeZone: 'America/New_York',
        todayDate: '2024-01-15',
        currentStreak: 2,
        expectedOffsetMinutes: -300,
      },
      {
        timeZone: 'Asia/Kolkata',
        todayDate: '2024-01-16',
        currentStreak: 3,
        expectedOffsetMinutes: 330,
      },
      {
        timeZone: 'Asia/Tokyo',
        todayDate: '2024-01-16',
        currentStreak: 3,
        expectedOffsetMinutes: 540,
      },
    ];

    expect(notification.createdAt).toBeInstanceOf(Date);
    expect(notification.updatedAt).toBeInstanceOf(Date);
    expect(notification.createdAt.toISOString()).toBe('2024-01-15T23:30:00.000Z');

    for (const expectation of expectations) {
      const result = calculateStreak(calendar, expectation.timeZone, instant);

      expect(result.todayDate).toBe(expectation.todayDate);
      expect(result.currentStreak).toBe(expectation.currentStreak);
      expect(result.totalContributions).toBe(3);
      expect(
        findTodayIndex(
          calendar.weeks.flatMap((week) => week.contributionDays),
          expectation.timeZone,
          instant
        )
      ).toBeGreaterThanOrEqual(0);
      expect(getTimezoneOffsetMinutes(instant, expectation.timeZone)).toBe(
        expectation.expectedOffsetMinutes
      );
    }
  });

  it('verifies leap year calendar boundaries preserve February 29 without alignment drops', () => {
    const leapCalendar = buildCalendar([
      { date: '2024-02-28', contributionCount: 2 },
      { date: '2024-02-29', contributionCount: 3 },
      { date: '2024-03-01', contributionCount: 4 },
    ]);

    const now = new Date('2024-02-29T12:00:00.000Z');

    expect(() => calculateMonthlyStats(leapCalendar, 'UTC', now)).not.toThrow();
    expect(() => calculateMonthlyStats(leapCalendar, 'Asia/Tokyo', now)).not.toThrow();

    const utcResult = calculateMonthlyStats(leapCalendar, 'UTC', now);
    const tokyoResult = calculateMonthlyStats(leapCalendar, 'Asia/Tokyo', now);

    expect(utcResult).toMatchObject({
      currentMonthTotal: 5,
      previousMonthTotal: 0,
      deltaPercentage: null,
      deltaAbsolute: 5,
      currentMonthName: 'February',
    });
    expect(tokyoResult.currentMonthTotal).toBe(5);
    expect(tokyoResult.currentMonthName).toBe('February');
  });

  it('keeps localized calendar date strings stable across targeted regional locales', () => {
    const instant = new Date('2024-01-16T00:00:00.000Z');

    const locales = ['en-US', 'en-GB', 'ja-JP'] as const;

    for (const locale of locales) {
      const parts = new Intl.DateTimeFormat(locale, {
        timeZone: locale === 'ja-JP' ? 'Asia/Tokyo' : 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(instant);

      const structuralParts = parts.filter((part) => part.type !== 'literal');

      expect(structuralParts.map((part) => part.type).sort()).toEqual(['day', 'month', 'year']);
      expect(structuralParts.every((part) => part.value.length > 0)).toBe(true);
      expect(parts.some((part) => part.type === 'literal')).toBe(true);
    }

    expect(getDatePartOrder(instant, 'en-US', 'UTC')).toEqual(['month', 'day', 'year']);
    expect(getDatePartOrder(instant, 'en-GB', 'UTC')).toEqual(['day', 'month', 'year']);
    expect(getDatePartOrder(instant, 'ja-JP', 'Asia/Tokyo')).toEqual(['year', 'month', 'day']);
  });

  it('evaluates offset calculation variations around the DST transition boundary', () => {
    const calendar = buildCalendar([
      { date: '2024-03-09', contributionCount: 1 },
      { date: '2024-03-10', contributionCount: 1 },
      { date: '2024-03-11', contributionCount: 1 },
    ]);

    const beforeDst = new Date('2024-03-10T06:30:00.000Z');
    const afterDst = new Date('2024-03-10T07:30:00.000Z');

    expect(getTimezoneOffsetMinutes(beforeDst, 'America/New_York')).toBe(-300);
    expect(getTimezoneOffsetMinutes(afterDst, 'America/New_York')).toBe(-240);

    const beforeResult = calculateStreak(calendar, 'America/New_York', beforeDst);
    const afterResult = calculateStreak(calendar, 'America/New_York', afterDst);

    expect(beforeResult.todayDate).toBe('2024-03-10');
    expect(afterResult.todayDate).toBe('2024-03-10');
    expect(beforeResult.currentStreak).toBe(2);
    expect(afterResult.currentStreak).toBe(2);
  });

  it('returns UTC defaults cleanly for invalid or zero-offset inputs without breaking calculation loops', () => {
    const calendar = buildCalendar([
      { date: '2024-05-01', contributionCount: 1 },
      { date: '2024-05-02', contributionCount: 0 },
    ]);

    const now = new Date('2024-05-01T12:00:00.000Z');
    const invalidTimezone = normalizeTimezoneLabel('UTC+25');
    const zeroOffsetTimezone = normalizeTimezoneLabel('0');

    expect(invalidTimezone).toBe('UTC');
    expect(zeroOffsetTimezone).toBe('UTC');

    expect(() => calculateStreak(calendar, invalidTimezone, now)).not.toThrow();
    expect(() => calculateMonthlyStats(calendar, zeroOffsetTimezone, now)).not.toThrow();

    const streakResult = calculateStreak(calendar, invalidTimezone, now);
    const monthlyResult = calculateMonthlyStats(calendar, zeroOffsetTimezone, now);

    expect(streakResult.todayDate).toBe('2024-05-01');
    expect(streakResult.currentStreak).toBe(1);
    expect(monthlyResult.currentMonthTotal).toBe(1);
    expect(monthlyResult.previousMonthTotal).toBe(0);
  });
});
