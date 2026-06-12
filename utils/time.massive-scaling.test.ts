import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from './time';

describe('time.ts calculation correctness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns correct seconds until UTC midnight at noon UTC', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(43200);
  });

  it('returns correct seconds close to UTC midnight', () => {
    vi.setSystemTime(new Date('2024-06-15T23:59:30.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(30);
  });

  it('returns a bounded value for UTC timezone calculations', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    const seconds = getSecondsUntilMidnightInTimezone('UTC');

    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(86400);
  });

  it('returns valid values for multiple timezones', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    const zones = ['UTC', 'Asia/Kolkata', 'Europe/London', 'America/New_York'];

    for (const zone of zones) {
      const seconds = getSecondsUntilMidnightInTimezone(zone);

      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThanOrEqual(86400);
    }
  });

  it('normalizes hour 24 correctly when calculating timezone midnight', () => {
    const formatToPartsMock = vi.fn().mockReturnValue([
      { type: 'hour', value: '24' },
      { type: 'minute', value: '00' },
      { type: 'second', value: '00' },
    ]);

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          formatToParts: formatToPartsMock,
        }) as unknown as Intl.DateTimeFormat
    );
    expect(getSecondsUntilMidnightInTimezone('UTC')).toBe(86400);
  });
});
