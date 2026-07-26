import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSecondsUntilMidnightInTimezone } from '../../utils/time';

function partsForTZ(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  return { year: get('year'), month: get('month'), day: get('day') };
}

describe('Timezone normalization & calendar boundary alignment', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('maps UTC timestamp to Asia/Kolkata local date across a leap-year boundary', () => {
    // UTC 2024-02-28T18:45:00Z -> Asia/Kolkata 2024-02-29T00:15:00+05:30 (leap day)
    vi.setSystemTime(new Date('2024-02-28T18:45:00.000Z'));

    const now = new Date();
    const p = partsForTZ(now, 'Asia/Kolkata');

    expect(p.year).toBe(2024);
    expect(p.month).toBe(2);
    expect(p.day).toBe(29);
  });

  it('verifies consecutive UTC days map to consecutive local dates (no gaps on leap year)', () => {
    const utcDates = [
      new Date('2024-02-28T00:00:00.000Z'),
      new Date('2024-02-29T00:00:00.000Z'),
      new Date('2024-03-01T00:00:00.000Z'),
    ];

    const localDays = utcDates.map((d) => {
      const p = partsForTZ(d, 'Asia/Kolkata');
      return p.day;
    });

    expect(localDays).toEqual([28, 29, 1]);
  });

  it('produces expected locale date strings for en-US and en-GB', () => {
    const d = new Date('2024-06-15T00:00:00.000Z');

    const us = d.toLocaleDateString('en-US', { timeZone: 'UTC' });
    const gb = d.toLocaleDateString('en-GB', { timeZone: 'UTC' });

    // en-US: M/D/YYYY  | en-GB: D/M/YYYY
    expect(us).toMatch(/6\/?15\/?2024/);
    expect(gb).toMatch(/15\/?06\/?2024/);
    expect(us).not.toBe(gb);
  });

  it('handles daylight saving transitions in America/New_York (spring-forward) without throwing and shows differing TTLs', () => {
    // Before DST jump: 2024-03-10T06:30:00Z => 01:30 EST (UTC-5)
    vi.setSystemTime(new Date('2024-03-10T06:30:00.000Z'));
    const before = getSecondsUntilMidnightInTimezone('America/New_York');

    // After the jump one hour later in UTC: 2024-03-10T07:30:00Z => 03:30 EDT (UTC-4)
    vi.setSystemTime(new Date('2024-03-10T07:30:00.000Z'));
    const after = getSecondsUntilMidnightInTimezone('America/New_York');

    expect(Number.isInteger(before)).toBe(true);
    expect(Number.isInteger(after)).toBe(true);
    // TTLs should be non-negative and, due to the DST shift, differ from one another
    expect(before).toBeGreaterThanOrEqual(0);
    expect(after).toBeGreaterThanOrEqual(0);
    expect(before).not.toBe(after);
  });

  it('ensures Asia/Tokyo offsets move commits across midnight to next visual date', () => {
    // UTC 2024-06-14T15:30:00Z -> Asia/Tokyo 2024-06-15T00:30:00+09:00
    vi.setSystemTime(new Date('2024-06-14T15:30:00.000Z'));

    const p = partsForTZ(new Date(), 'Asia/Tokyo');

    expect(p.year).toBe(2024);
    expect(p.month).toBe(6);
    expect(p.day).toBe(15);
  });
});
