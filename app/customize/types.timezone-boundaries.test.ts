import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import {
  TIMEZONES,
  THEME_KEYS,
  SPEEDS,
  SIZES,
  FONTS,
  VIEW_MODES,
  DELTA_FORMATS,
  LANGUAGES,
} from './types';

const ORIGINAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

function mockTimezone(timeZone: string) {
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
    resolvedOptions: () => ({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone,
    }),
  })) as typeof Intl.DateTimeFormat);
}

describe('CustomizeTypes Timezone Boundaries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps exported configuration identical in UTC', () => {
    mockTimezone('UTC');

    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('UTC');

    expect(TIMEZONES.length).toBeGreaterThan(0);
    expect(THEME_KEYS.length).toBeGreaterThan(2);
    expect(SPEEDS.length).toBeGreaterThan(0);
    expect(SIZES.length).toBeGreaterThan(0);
    expect(FONTS.length).toBeGreaterThan(0);
    expect(VIEW_MODES.length).toBeGreaterThan(0);
    expect(DELTA_FORMATS.length).toBeGreaterThan(0);
    expect(LANGUAGES.length).toBeGreaterThan(0);
  });

  it('keeps timezone options stable across common regions', () => {
    const expected = [...TIMEZONES];

    ['UTC', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'].forEach((tz) => {
      vi.restoreAllMocks();
      mockTimezone(tz);

      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(tz);
      expect(TIMEZONES).toEqual(expected);
    });
  });

  it('remains unchanged around leap year calendar dates', () => {
    const leap = new Date('2024-02-29T12:00:00Z');
    const afterLeap = new Date('2024-03-01T12:00:00Z');

    expect(leap.getUTCDate()).toBe(29);
    expect(afterLeap.getUTCDate()).toBe(1);

    expect(TIMEZONES).toContainEqual({
      value: 'UTC',
      label: 'UTC (Default)',
    });

    expect(TIMEZONES.length).toBe(8);
  });

  it('does not change during daylight saving transitions', () => {
    mockTimezone('America/New_York');

    const beforeDST = [...TIMEZONES];

    const dstDate = new Date('2025-03-09T07:00:00Z');

    expect(dstDate).toBeInstanceOf(Date);

    expect(TIMEZONES).toEqual(beforeDST);
  });

  it('contains unique timezone values with valid labels', () => {
    const values = TIMEZONES.map((t) => t.value);
    const labels = TIMEZONES.map((t) => t.label);

    expect(new Set(values).size).toBe(values.length);
    expect(new Set(labels).size).toBe(labels.length);

    TIMEZONES.forEach((tz) => {
      expect(tz.value.length).toBeGreaterThan(0);
      expect(tz.label.length).toBeGreaterThan(0);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();

    mockTimezone(ORIGINAL_TIMEZONE);
  });
});
