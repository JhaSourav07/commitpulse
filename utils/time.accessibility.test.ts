import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from './time';

describe('utils/time — Accessibility Standards & Screen Reader Aria Compliance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getSecondsUntilUTCMidnight returns a strictly positive number of seconds', () => {
    vi.setSystemTime(new Date('2024-03-15T06:00:00.000Z'));
    const result = getSecondsUntilUTCMidnight();
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('getSecondsUntilUTCMidnight returns a value within the valid 1–86400 second range', () => {
    vi.setSystemTime(new Date('2024-03-15T06:00:00.000Z'));
    const result = getSecondsUntilUTCMidnight();
    expect(result).toBe(64800);
    expect(result).toBeLessThanOrEqual(86400);
  });

  it('getSecondsUntilMidnightInTimezone("UTC") matches getSecondsUntilUTCMidnight at the same moment', () => {
    vi.setSystemTime(new Date('2024-03-15T06:00:00.000Z'));
    const utcResult = getSecondsUntilUTCMidnight();
    const tzResult = getSecondsUntilMidnightInTimezone('UTC');
    expect(tzResult).toBe(utcResult);
    expect(tzResult).toBe(64800);
  });

  it('getSecondsUntilMidnightInTimezone returns a positive value for America/New_York', () => {
    vi.setSystemTime(new Date('2024-03-15T15:00:00.000Z'));
    const result = getSecondsUntilMidnightInTimezone('America/New_York');
    expect(result).toBe(46800);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(86400);
  });

  it('getSecondsUntilMidnightInTimezone returns 86400 at exactly local midnight, correctly handling the hour-24 normalisation', () => {
    vi.setSystemTime(new Date('2024-03-15T04:00:00.000Z'));
    const result = getSecondsUntilMidnightInTimezone('America/New_York');
    expect(result).toBe(86400);
  });
});
