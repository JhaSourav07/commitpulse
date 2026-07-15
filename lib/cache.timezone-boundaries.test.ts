import { describe, expect, it, afterEach, vi } from 'vitest';
import { TTLCache } from './cache';

type CalendarDay = {
  date: string;
  contributionCount: number;
};

type CalendarWeek = {
  contributionDays: CalendarDay[];
};

type CachedCalendar = {
  totalContributions: number;
  weeks: CalendarWeek[];
};

const DATE_PART_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = DATE_PART_FORMATTER_CACHE.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  DATE_PART_FORMATTER_CACHE.set(timeZone, formatter);
  return formatter;
}

function getVisualDate(timestamp: string | Date, timeZone: string): string {
  const parts = getFormatter(timeZone).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function buildCalendarRange(startDate: string, endDate: string): CachedCalendar {
  const days: CalendarDay[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      contributionCount: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    totalContributions: 0,
    weeks: [{ contributionDays: days }],
  };
}

function formatCalendarDate(date: Date, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

describe('TTLCache timezone normalization and calendar boundary alignment', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. mocks standard timezone settings for UTC, EST, IST, and JST visual dates', () => {
    const cache = new TTLCache<Record<string, string>>();
    const timestamp = '2024-01-01T02:30:00.000Z';
    const visualDates = {
      UTC: getVisualDate(timestamp, 'UTC'),
      EST: getVisualDate(timestamp, 'America/New_York'),
      IST: getVisualDate(timestamp, 'Asia/Kolkata'),
      JST: getVisualDate(timestamp, 'Asia/Tokyo'),
    };

    cache.set('calendar:timezone-map', visualDates, 60_000);

    expect(cache.get('calendar:timezone-map')).toEqual({
      UTC: '2024-01-01',
      EST: '2023-12-31',
      IST: '2024-01-01',
      JST: '2024-01-01',
    });

    cache.destroy();
  });

  it('2. aligns cached commit activity onto the correct visual dates across offsets', () => {
    const cache = new TTLCache<CachedCalendar>();
    const commitTimestamp = '2024-06-30T23:30:00.000Z';
    const utcDate = getVisualDate(commitTimestamp, 'UTC');
    const kolkataDate = getVisualDate(commitTimestamp, 'Asia/Kolkata');

    cache.set(
      'calendar:activity-alignment',
      {
        totalContributions: 2,
        weeks: [
          {
            contributionDays: [
              { date: utcDate, contributionCount: 1 },
              { date: kolkataDate, contributionCount: 1 },
            ],
          },
        ],
      },
      60_000
    );

    const cachedDays = cache.get('calendar:activity-alignment')?.weeks[0]?.contributionDays;

    expect(cachedDays).toEqual([
      { date: '2024-06-30', contributionCount: 1 },
      { date: '2024-07-01', contributionCount: 1 },
    ]);

    cache.destroy();
  });

  it('3. preserves leap-year calendar boundaries without gaps in cached grids', () => {
    const cache = new TTLCache<CachedCalendar>();
    const leapBoundaryCalendar = buildCalendarRange('2024-02-27', '2024-03-01');

    cache.set('calendar:leap-year-boundary', leapBoundaryCalendar, 60_000);

    const cachedDates = cache
      .get('calendar:leap-year-boundary')
      ?.weeks[0]?.contributionDays.map((day) => day.date);

    expect(cachedDates).toEqual(['2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01']);
    expect(cachedDates).toHaveLength(4);

    cache.destroy();
  });

  it('4. returns stable calendar date formats for each locale and timezone pair', () => {
    const cache = new TTLCache<Record<string, string>>();
    const timestamp = new Date('2024-12-31T18:45:00.000Z');
    const formattedDates = {
      usUtc: formatCalendarDate(timestamp, 'en-US', 'UTC'),
      gbUtc: formatCalendarDate(timestamp, 'en-GB', 'UTC'),
      jpTokyo: formatCalendarDate(timestamp, 'ja-JP', 'Asia/Tokyo'),
      inKolkata: formatCalendarDate(timestamp, 'en-IN', 'Asia/Kolkata'),
    };

    cache.set('calendar:locale-formats', formattedDates, 60_000);

    expect(cache.get('calendar:locale-formats')).toEqual({
      usUtc: '12/31/2024',
      gbUtc: '31/12/2024',
      jpTokyo: '2025/01/01',
      inKolkata: '01/01/2025',
    });

    cache.destroy();
  });

  it('5. keeps cached date keys stable around daylight-saving transition dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-10T06:30:00.000Z'));

    const cache = new TTLCache<Record<string, string>>();
    const dstBoundaryDates = {
      beforeSpringForward: getVisualDate('2024-03-10T06:59:00.000Z', 'America/New_York'),
      afterSpringForward: getVisualDate('2024-03-10T07:01:00.000Z', 'America/New_York'),
      beforeFallBack: getVisualDate('2024-11-03T05:59:00.000Z', 'America/New_York'),
      afterFallBack: getVisualDate('2024-11-03T06:01:00.000Z', 'America/New_York'),
    };

    cache.set('calendar:dst-boundaries', dstBoundaryDates, 60_000);
    vi.advanceTimersByTime(59_999);

    expect(cache.get('calendar:dst-boundaries')).toEqual({
      beforeSpringForward: '2024-03-10',
      afterSpringForward: '2024-03-10',
      beforeFallBack: '2024-11-03',
      afterFallBack: '2024-11-03',
    });

    vi.advanceTimersByTime(2);
    expect(cache.get('calendar:dst-boundaries')).toBeNull();

    cache.destroy();
  });
});
