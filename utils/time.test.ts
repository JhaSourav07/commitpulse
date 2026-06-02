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

  it('always returns an integer with sub-second precision input', () => {
    vi.setSystemTime(new Date('2024-06-15T23:59:59.999Z'));

    const result = getSecondsUntilUTCMidnight();
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(0);
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

  it('always returns an integer with sub-second precision input', () => {
    // 2024-06-16T03:59:59.999Z is 23:59:59.999 in Etc/GMT+4 (UTC-4)
    vi.setSystemTime(new Date('2024-06-16T03:59:59.999Z'));

    const result = getSecondsUntilMidnightInTimezone('Etc/GMT+4');
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(1);
  });

  it('handles extreme timezone Etc/GMT-14 (UTC+14)', () => {
    // UTC 00:00 → local time 14:00 in UTC+14
    vi.setSystemTime(new Date('2024-06-15T00:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Etc/GMT-14')).toBe(10 * 3600);
  });

  it('should calculate seconds until UTC midnight correctly at a calendar boundary', () => {
    // Arrange: Set time to Dec 31, 2023, 23:59:50 UTC (10 seconds before New Year)
    const boundaryTime = new Date(Date.UTC(2023, 11, 31, 23, 59, 50));
    vi.setSystemTime(boundaryTime);

    // Act
    const seconds = getSecondsUntilUTCMidnight();

    // Assert: Exactly 10 seconds should remain
    expect(seconds).toBe(10);
  });

  it('should handle extreme positive timezone offset boundary (+14:00)', () => {
    // Arrange: Pacific/Kiritimati is UTC+14.
    // When UTC is Dec 31, 09:59:50, Kiritimati is Dec 31, 23:59:50 (10 seconds to midnight)
    const boundaryTime = new Date(Date.UTC(2023, 11, 31, 9, 59, 50));
    vi.setSystemTime(boundaryTime);

    // Act
    const seconds = getSecondsUntilMidnightInTimezone('Pacific/Kiritimati');

    // Assert
    expect(seconds).toBe(10);
  });

  it('should handle extreme negative timezone offset boundary (-11:00)', () => {
    // Arrange: Pacific/Midway is UTC-11.
    // When UTC is Jan 1, 10:59:50, Midway is Dec 31, 23:59:50 (10 seconds to midnight)
    const boundaryTime = new Date(Date.UTC(2024, 0, 1, 10, 59, 50));
    vi.setSystemTime(boundaryTime);

    // Act
    const seconds = getSecondsUntilMidnightInTimezone('Pacific/Midway');

    // Assert
    expect(seconds).toBe(10);
  });

  it('should handle exact midnight boundary gracefully (0 seconds remaining)', () => {
    // Arrange: Exactly midnight in UTC
    const midnightTime = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    vi.setSystemTime(midnightTime);

    // Act
    const secondsUTC = getSecondsUntilUTCMidnight();
    const secondsLondon = getSecondsUntilMidnightInTimezone('Europe/London');

    // Assert: Both should recognize it's 24 hours (86400 seconds) until the NEXT midnight
    // Since the logic does `86400 - (hour * 3600 + ...)`, at 00:00:00 it returns 86400.
    expect(secondsUTC).toBe(86400);
    expect(secondsLondon).toBe(86400);
  });

  it('should handle extreme negative timezone offset boundary (-12:00)', () => {
    // Arrange: Etc/GMT+12 is UTC-12 (Baker Island / Howland Island).
    // When UTC is Jan 1, 11:59:50, Baker Island is Dec 31, 23:59:50 (10 seconds to midnight)
    const boundaryTime = new Date(Date.UTC(2024, 0, 1, 11, 59, 50));
    vi.setSystemTime(boundaryTime);

    // Act
    const seconds = getSecondsUntilMidnightInTimezone('Etc/GMT+12');

    // Assert: Should correctly calculate 10 seconds without calendar shifting
    expect(seconds).toBe(10);
  });

  it('should handle extreme timezone offsets without calendar date shifting', () => {
    // Arrange: Test the most extreme offsets to ensure no calendar date shifting occurs
    const extremeOffsets = [
      { tz: 'Etc/GMT+12', utcHour: 12 }, // UTC-12
      { tz: 'Etc/GMT-14', utcHour: 10 }, // UTC+14
    ];

    for (const { tz, utcHour } of extremeOffsets) {
      // Set UTC time such that local time is exactly midnight
      vi.setSystemTime(new Date(Date.UTC(2024, 6, 15, utcHour, 0, 0)));

      // Act: Get seconds until midnight in this timezone
      const seconds = getSecondsUntilMidnightInTimezone(tz);

      // Assert: At local midnight, should return exactly 86400 seconds (full day)
      expect(seconds).toBe(86400);
    }
  });
});

describe('getSecondsUntilUTCMidnight — sliding window boundary robustness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('verifies utility guarantees keys expire exactly at window limit across a sliding range', () => {
    // Target inputs: Sliding time range approaching midnight in Asia/Kolkata (UTC+5:30)
    // Local midnight happens at UTC 18:30:00
    const slidingCases: [string, number][] = [
      ['2024-06-15T17:30:00.000Z', 3600], // 1 hour before local midnight
      ['2024-06-15T18:00:00.000Z', 1800], // 30 mins before local midnight
      ['2024-06-15T18:29:59.000Z', 1], // 1 second before local midnight
      ['2024-06-15T18:30:00.000Z', 86400], // Exactly local midnight (resets to full day)
    ];

    for (const [utcTime, expectedTTL] of slidingCases) {
      vi.setSystemTime(new Date(utcTime));
      const seconds = getSecondsUntilMidnightInTimezone('Asia/Kolkata');

      // Assert that outputs match guarantees keys expire exactly at window limit
      expect(seconds).toBe(expectedTTL);
    }
  });

  it('returns correct TTL across a sliding window of times approaching UTC midnight', () => {
    // Verifies that the utility guarantees keys expire exactly at the window limit.
    // Each entry is [UTC time string, expected seconds until next midnight].
    const cases: [string, number][] = [
      ['2024-06-15T23:00:00.000Z', 3600], // 1 hour before midnight
      ['2024-06-15T23:30:00.000Z', 1800], // 30 minutes before midnight
      ['2024-06-15T23:45:00.000Z', 900], // 15 minutes before midnight
      ['2024-06-15T23:59:00.000Z', 60], // 1 minute before midnight
      ['2024-06-15T23:59:59.000Z', 1], // 1 second before midnight
      ['2024-06-16T00:00:00.000Z', 86400], // exactly at midnight, resets to full day
    ];

    for (const [time, expected] of cases) {
      vi.setSystemTime(new Date(time));
      expect(getSecondsUntilUTCMidnight()).toBe(expected);
    }
  });
});

describe('getSecondsUntilMidnightInTimezone — extreme timezone offset boundary robustness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts timestamp cleanly to target offset without calendar shifting (UTC+5:30)', () => {
    // UTC 2024-06-15T18:30:00Z = 2024-06-16T00:00:00 in Asia/Kolkata (UTC+5:30)
    // So exactly at local midnight → 86400 seconds remaining
    vi.setSystemTime(new Date('2024-06-15T18:30:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Asia/Kolkata')).toBe(86400);
  });

  it('converts timestamp cleanly to target offset without calendar shifting (UTC+14)', () => {
    // UTC 2024-06-14T10:00:00Z = 2024-06-15T00:00:00 in Pacific/Kiritimati (UTC+14)
    // Exactly local midnight → 86400 seconds remaining, no date shift
    vi.setSystemTime(new Date('2024-06-14T10:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Pacific/Kiritimati')).toBe(86400);
  });

  it('converts timestamp cleanly to target offset without calendar shifting (UTC-12)', () => {
    // UTC 2024-06-15T12:00:00Z = 2024-06-15T00:00:00 in Etc/GMT+12 (UTC-12)
    // Exactly local midnight → 86400 seconds remaining, no date shift
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Etc/GMT+12')).toBe(86400);
  });

  it('handles a timestamp near year-end boundary without calendar shifting (UTC+14)', () => {
    // UTC 2023-12-31T10:00:00Z = 2024-01-01T00:00:00 in Pacific/Kiritimati
    // Crosses year boundary cleanly → 86400 seconds remaining
    vi.setSystemTime(new Date('2023-12-31T10:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Pacific/Kiritimati')).toBe(86400);
  });

  it('handles a timestamp near year-end boundary without calendar shifting (UTC-11)', () => {
    // UTC 2024-01-01T11:00:00Z = 2024-01-01T00:00:00 in Pacific/Midway (UTC-11)
    // Crosses year boundary cleanly → 86400 seconds remaining
    vi.setSystemTime(new Date('2024-01-01T11:00:00.000Z'));

    expect(getSecondsUntilMidnightInTimezone('Pacific/Midway')).toBe(86400);
  });

  it('throws a RangeError for invalid timezone identifiers', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    expect(() => getSecondsUntilMidnightInTimezone('Invalid/Timezone')).toThrow(RangeError);
  });
});
