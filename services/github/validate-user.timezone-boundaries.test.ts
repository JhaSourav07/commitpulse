// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SupportedTimezone = 'America/New_York' | 'Asia/Kolkata' | 'Asia/Tokyo' | 'UTC';

type CalendarPartType = 'day' | 'month' | 'year';

type VisualDateParts = Readonly<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}>;

type StructuredCalendarPart = Readonly<{
  type: CalendarPartType;
  value: string;
}>;

type TimezoneTrackingLimit = Readonly<{
  minimumOffsetMinutes: number;
  maximumOffsetMinutes: number;
}>;

const originalTimezone = process.env.TZ;

const timezoneTrackingLimits: Record<SupportedTimezone, TimezoneTrackingLimit> = {
  'America/New_York': {
    minimumOffsetMinutes: -300,
    maximumOffsetMinutes: -240,
  },
  'Asia/Kolkata': {
    minimumOffsetMinutes: 330,
    maximumOffsetMinutes: 330,
  },
  'Asia/Tokyo': {
    minimumOffsetMinutes: 540,
    maximumOffsetMinutes: 540,
  },
  UTC: {
    minimumOffsetMinutes: 0,
    maximumOffsetMinutes: 0,
  },
};

beforeEach(() => {
  process.env.TZ = 'UTC';
});

afterEach(() => {
  if (originalTimezone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimezone;
  }

  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function resolveTimezone(region?: string): SupportedTimezone {
  switch (region) {
    case 'America/New_York':
    case 'Asia/Kolkata':
    case 'Asia/Tokyo':
    case 'UTC':
      return region;
    default:
      return 'UTC';
  }
}

function formatDateParts(date: Date, timeZone: SupportedTimezone): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date);
}

function getPartValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPart['type']
): string {
  const match = parts.find((part) => part.type === type);

  if (match === undefined) {
    throw new Error(`Missing date part: ${type}`);
  }

  return match.value;
}

function toVisualDateParts(date: Date, timeZone: SupportedTimezone): VisualDateParts {
  const parts = formatDateParts(date, timeZone);

  return {
    year: Number.parseInt(getPartValue(parts, 'year'), 10),
    month: Number.parseInt(getPartValue(parts, 'month'), 10),
    day: Number.parseInt(getPartValue(parts, 'day'), 10),
    hour: Number.parseInt(getPartValue(parts, 'hour'), 10),
    minute: Number.parseInt(getPartValue(parts, 'minute'), 10),
    second: Number.parseInt(getPartValue(parts, 'second'), 10),
  };
}

function toVisualDateKey(date: Date, timeZone: SupportedTimezone): string {
  const parts = toVisualDateParts(date, timeZone);

  return `${parts.year.toString().padStart(4, '0')}-${parts.month.toString().padStart(2, '0')}-${parts.day
    .toString()
    .padStart(2, '0')}`;
}

function getObservedOffsetMinutes(date: Date, timeZone: SupportedTimezone): number {
  const parts = toVisualDateParts(date, timeZone);
  const derivedUtcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return Math.round((derivedUtcMillis - date.getTime()) / 60_000);
}

function buildMonthlyVisualGrid(
  year: number,
  monthIndex: number,
  timeZone: SupportedTimezone
): string[] {
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return Array.from({ length: dayCount }, (_value, index) => {
    const sourceDate = new Date(Date.UTC(year, monthIndex, index + 1, 12, 0, 0));
    return toVisualDateKey(sourceDate, timeZone);
  });
}

function projectStructuredCalendarParts(
  date: Date,
  timeZone: SupportedTimezone
): StructuredCalendarPart[] {
  const parts = formatDateParts(date, timeZone);

  return parts
    .filter((part): part is Intl.DateTimeFormatPart & { type: CalendarPartType } => {
      return part.type === 'day' || part.type === 'month' || part.type === 'year';
    })
    .map((part) => ({
      type: part.type,
      value: part.value,
    }));
}

function isOffsetWithinLimit(timeZone: SupportedTimezone, offsetMinutes: number): boolean {
  const limit = timezoneTrackingLimits[timeZone];
  return offsetMinutes >= limit.minimumOffsetMinutes && offsetMinutes <= limit.maximumOffsetMinutes;
}

describe('validate-user timezone boundaries', () => {
  it('maps the same instant to the expected visual dates in New York, Kolkata, and Tokyo', () => {
    const instant = new Date('2024-12-31T23:30:00.000Z');

    expect(toVisualDateKey(instant, 'America/New_York')).toBe('2024-12-31');
    expect(toVisualDateKey(instant, 'Asia/Kolkata')).toBe('2025-01-01');
    expect(toVisualDateKey(instant, 'Asia/Tokyo')).toBe('2025-01-01');
  });

  it('keeps leap-day grids contiguous across February 29 in Asia/Kolkata', () => {
    const grid = buildMonthlyVisualGrid(2024, 1, 'Asia/Kolkata');

    expect(grid).toHaveLength(29);
    expect(grid[27]).toBe('2024-02-28');
    expect(grid[28]).toBe('2024-02-29');
    expect(new Set(grid).size).toBe(29);
  });

  it('formats localized calendar parts through stable structured arrays', () => {
    const instant = new Date('2024-02-28T18:45:00.000Z');
    const parts = projectStructuredCalendarParts(instant, 'Asia/Kolkata');

    expect(parts).toEqual([
      { type: 'day', value: '29' },
      { type: 'month', value: '02' },
      { type: 'year', value: '2024' },
    ]);
    expect(parts.map((part) => part.value).join('/')).toBe('29/02/2024');
  });

  it('switches New York offset safely across the DST boundary', () => {
    const beforeBoundary = new Date('2024-03-10T06:59:59.000Z');
    const afterBoundary = new Date('2024-03-10T07:00:00.000Z');

    const beforeParts = toVisualDateParts(beforeBoundary, 'America/New_York');
    const afterParts = toVisualDateParts(afterBoundary, 'America/New_York');
    const beforeOffset = getObservedOffsetMinutes(beforeBoundary, 'America/New_York');
    const afterOffset = getObservedOffsetMinutes(afterBoundary, 'America/New_York');

    expect(beforeParts).toMatchObject({ hour: 1, minute: 59, second: 59 });
    expect(afterParts).toMatchObject({ hour: 3, minute: 0, second: 0 });
    expect(beforeOffset).toBe(-300);
    expect(afterOffset).toBe(-240);
    expect(isOffsetWithinLimit('America/New_York', beforeOffset)).toBe(true);
    expect(isOffsetWithinLimit('America/New_York', afterOffset)).toBe(true);
  });

  it('falls back to UTC for missing or unmapped regional options', () => {
    const instant = new Date('2024-06-15T12:34:56.000Z');

    expect(resolveTimezone(undefined)).toBe('UTC');
    expect(resolveTimezone('')).toBe('UTC');
    expect(resolveTimezone('Europe/Paris')).toBe('UTC');

    expect(toVisualDateKey(instant, resolveTimezone(undefined))).toBe('2024-06-15');
    expect(toVisualDateKey(instant, resolveTimezone('Europe/Paris'))).toBe('2024-06-15');
    expect(getObservedOffsetMinutes(instant, resolveTimezone(''))).toBe(0);
    expect(isOffsetWithinLimit('UTC', 0)).toBe(true);
  });
});
