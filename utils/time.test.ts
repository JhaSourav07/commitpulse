import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSecondsUntilUTCMidnight } from './time';

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
