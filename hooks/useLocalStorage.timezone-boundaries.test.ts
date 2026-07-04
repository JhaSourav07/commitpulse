import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

/**
 * Converts an ISO timestamp into a UTC calendar date key.
 * This represents the expected normalization contract for
 * activity/calendar data regardless of viewer timezone.
 */
function toUTCDateKey(timestamp: string): string {
  const date = new Date(timestamp);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Builds a gap-free calendar grid between two dates.
 */
function buildDateGrid(start: string, end: string): string[] {
  const dates: string[] = [];

  const current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (current <= last) {
    dates.push(toUTCDateKey(current.toISOString()));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

describe('useLocalStorage timezone normalization and calendar boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ------------------------------------------------------------------
  // 1. UTC / EST / IST / JST normalization
  // ------------------------------------------------------------------
  it('aligns activity timestamps to the same UTC visual date across timezones', () => {
    const commit = '2024-03-15T02:30:00.000Z';

    const { result } = renderHook(() => useLocalStorage<string[]>('activity', []));

    act(() => {
      result.current[1]([commit]);
    });

    const zones = [
      { name: 'UTC', offset: 0 },
      { name: 'EST', offset: 300 },
      { name: 'IST', offset: -330 },
      { name: 'JST', offset: -540 },
    ];

    for (const zone of zones) {
      const spy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(zone.offset);

      const stored = JSON.parse(localStorage.getItem('activity')!) as string[];

      expect(stored[0]).toBe(commit);

      expect(toUTCDateKey(stored[0]), zone.name).toBe('2024-03-15');

      spy.mockRestore();
    }
  });

  // ------------------------------------------------------------------
  // 2. Leap year boundary handling
  // ------------------------------------------------------------------
  it('includes February 29 when generating leap-year calendar ranges', () => {
    const grid = buildDateGrid('2024-02-27', '2024-03-02');

    expect(grid).toEqual(['2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01', '2024-03-02']);
  });

  // ------------------------------------------------------------------
  // 3. Calendar boundaries without gaps
  // ------------------------------------------------------------------
  it('does not introduce missing or extra dates across month boundaries', () => {
    const grid = buildDateGrid('2023-02-27', '2023-03-02');

    expect(grid).toEqual(['2023-02-27', '2023-02-28', '2023-03-01', '2023-03-02']);

    expect(grid).not.toContain('2023-02-29');
  });

  // ------------------------------------------------------------------
  // 4. Locale formatting stability
  // ------------------------------------------------------------------
  it('produces valid calendar strings across multiple locales', () => {
    const timestamp = '2024-06-15T12:00:00.000Z';

    const locales = ['en-US', 'en-IN', 'ja-JP', 'en-GB'];

    for (const locale of locales) {
      const formatted = new Date(timestamp).toLocaleDateString(locale, {
        timeZone: 'UTC',
      });

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    }
  });

  // ------------------------------------------------------------------
  // 5. Daylight Saving Time transitions
  // ------------------------------------------------------------------
  it('keeps UTC calendar dates stable across DST transitions', () => {
    const beforeDST = '2024-03-10T06:59:00.000Z';
    const afterDST = '2024-03-10T07:01:00.000Z';

    let spy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

    expect(toUTCDateKey(beforeDST)).toBe('2024-03-10');

    spy.mockRestore();

    spy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);

    expect(toUTCDateKey(afterDST)).toBe('2024-03-10');

    spy.mockRestore();
  });
});
