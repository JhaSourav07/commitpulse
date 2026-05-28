import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from './time';

describe('getSecondsUntilUTCMidnight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns exactly 86400 seconds at UTC midnight (start of a new day)', () => {
    vi.setSystemTime(new Date('2024-06-15T00:00:00.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(86400);
  });

  it('returns 43200 seconds (12 hours) at UTC noon', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(43200);
  });

  it('returns 1 second when it is one second before UTC midnight', () => {
    vi.setSystemTime(new Date('2024-06-15T23:59:59.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(1);
  });

  it('floors sub-second remainders — never returns a fraction', () => {
    // 500 ms before midnight: Math.floor(0.5) = 0, so the result should be 0.
    vi.setSystemTime(new Date('2024-06-15T23:59:59.500Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(0);
  });

  it('always returns a non-negative integer throughout the day', () => {
    const checkTimes = [
      '2024-03-01T03:15:00.000Z',
      '2024-03-01T09:45:30.123Z',
      '2024-03-01T17:59:00.999Z',
      '2024-12-31T22:00:00.000Z',
    ];

    for (const time of checkTimes) {
      vi.setSystemTime(new Date(time));
      const result = getSecondsUntilUTCMidnight();
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('crosses a month boundary correctly (leap-year Feb → Mar)', () => {
    // 2024 is a leap year, so Feb 29 is valid. The next midnight rolls into March.
    vi.setSystemTime(new Date('2024-02-29T18:00:00.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(21600); // 6 hours = 21600 s
  });

  it('crosses a year boundary correctly (Dec 31 → Jan 1)', () => {
    vi.setSystemTime(new Date('2024-12-31T06:00:00.000Z'));

    expect(getSecondsUntilUTCMidnight()).toBe(64800); // 18 hours = 64800 s
  });
});

it('returns positive seconds for every hour of day', () => {
  for (let hour = 0; hour < 24; hour++) {
    const fakeDate = new Date(Date.UTC(2025, 0, 1, hour, 0, 0));

    vi.setSystemTime(fakeDate);

    const seconds = getSecondsUntilUTCMidnight();

    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(86400);
  }
});

describe('getSecondsUntilMidnightInTimezone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // All tests use 'Etc/GMT+4' (UTC-4, no DST) so results are deterministic.

  it('returns 86400 seconds at local midnight in the given timezone', () => {
    // 2024-06-15T04:00:00Z is 00:00:00 in Etc/GMT+4 (UTC-4)
    vi.setSystemTime(new Date('2024-06-15T04:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Etc/GMT+4')).toBe(86400);
  });

  it('returns 43200 seconds (12 hours) at local noon', () => {
    // 2024-06-15T16:00:00Z is 12:00:00 in Etc/GMT+4
    vi.setSystemTime(new Date('2024-06-15T16:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Etc/GMT+4')).toBe(43200);
  });

  it('returns 1 second when it is one second before local midnight', () => {
    // 2024-06-16T03:59:59Z is 23:59:59 in Etc/GMT+4
    vi.setSystemTime(new Date('2024-06-16T03:59:59.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Etc/GMT+4')).toBe(1);
  });

  it('gives a different result from getSecondsUntilUTCMidnight when tz is not UTC', () => {
    // At 2024-06-15T10:00:00Z:
    //   - UTC midnight is 14 hours away (50400 s)
    //   - Etc/GMT+4 midnight is 18 hours away (64800 s)
    vi.setSystemTime(new Date('2024-06-15T10:00:00.000Z'));

    const utcResult = getSecondsUntilUTCMidnight();
    const tzResult = getSecondsUntilMidnightInTimezone('Etc/GMT+4');

    expect(utcResult).toBe(50400);
    expect(tzResult).toBe(64800);
    expect(tzResult).not.toBe(utcResult);
  });

  it('matches getSecondsUntilUTCMidnight when tz is UTC', () => {
    vi.setSystemTime(new Date('2024-06-15T10:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('UTC')).toBe(getSecondsUntilUTCMidnight());
  });

  it('always returns a non-negative integer', () => {
    const times = [
      '2024-03-01T05:15:00.000Z',
      '2024-06-15T19:45:30.123Z',
      '2024-12-31T23:00:00.000Z',
    ];

    for (const t of times) {
      vi.setSystemTime(new Date(t));
      const result = getSecondsUntilMidnightInTimezone('Etc/GMT+4');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});
