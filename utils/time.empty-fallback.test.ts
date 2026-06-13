/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from './time';

describe('getSecondsUntilMidnightInTimezone - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. falls back to UTC midnight calculation when tz is completely omitted', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    expect(getSecondsUntilMidnightInTimezone()).toBe(getSecondsUntilUTCMidnight());
  });

  it('2. falls back to UTC midnight calculation when tz is undefined', () => {
    vi.setSystemTime(new Date('2024-06-15T18:00:00.000Z'));
    expect(getSecondsUntilMidnightInTimezone(undefined)).toBe(getSecondsUntilUTCMidnight());
  });

  it('3. falls back to UTC midnight calculation when tz is null', () => {
    vi.setSystemTime(new Date('2024-06-15T20:30:00.000Z'));
    expect(getSecondsUntilMidnightInTimezone(null as any)).toBe(getSecondsUntilUTCMidnight());
  });

  it('4. falls back to UTC midnight calculation when tz is empty or whitespace string', () => {
    vi.setSystemTime(new Date('2024-06-15T23:59:00.000Z'));
    expect(getSecondsUntilMidnightInTimezone('')).toBe(getSecondsUntilUTCMidnight());
    expect(getSecondsUntilMidnightInTimezone('   ')).toBe(getSecondsUntilUTCMidnight());
  });
});
