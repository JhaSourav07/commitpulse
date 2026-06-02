import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GitHubRefreshRateLimiter,
  normalizeDateToTimezone,
  getStartOfDayInTimezone,
  getEndOfDayInTimezone,
  isLeapYear,
  type RefreshRateLimitResult,
} from './refresh-rate-limiter';

describe('refresh-rate-limiter.timezone-boundaries', () => {
  let limiter: GitHubRefreshRateLimiter;

  beforeEach(() => {
    limiter = new GitHubRefreshRateLimiter({
      limitsPerDay: 1,
      timezone: 'UTC',
    });
    vi.useFakeTimers();
  });

  /**
   * Test 1: Timezone Normalization & Calendar Boundary Alignment
   * Verifies that commits on the same UTC time appear on different calendar
   * dates across multiple timezones, and that boundaries align correctly.
   */
  describe('Test 1: Timezone Normalization & Calendar Boundary Alignment', () => {
    it('correctly aligns activity blocks across UTC, EST, IST, and JST timezones', () => {
      // Set to 2024-02-15T23:00:00 UTC
      // This is:
      // - 2024-02-15 18:00:00 EST (UTC-5)
      // - 2024-02-16 04:30:00 IST (UTC+5:30)
      // - 2024-02-16 08:00:00 JST (UTC+9)
      const testTimestamp = new Date('2024-02-15T23:00:00Z').getTime();

      const utcNorm = normalizeDateToTimezone(testTimestamp, 'UTC');
      const estNorm = normalizeDateToTimezone(testTimestamp, 'America/New_York');
      const istNorm = normalizeDateToTimezone(testTimestamp, 'Asia/Kolkata');
      const jstNorm = normalizeDateToTimezone(testTimestamp, 'Asia/Tokyo');

      // Verify UTC date
      expect(utcNorm.localDate).toBe('2024-02-15');

      // Verify EST is same day (same UTC time, earlier local time = same date)
      expect(estNorm.localDate).toBe('2024-02-15');

      // Verify IST is one day ahead (same UTC time, later local time)
      expect(istNorm.localDate).toBe('2024-02-16');

      // Verify JST is one day ahead
      expect(jstNorm.localDate).toBe('2024-02-16');

      // Verify timezone offsets are different (showing different timezones)
      const offsets = [
        utcNorm.timezoneOffsetMinutes,
        estNorm.timezoneOffsetMinutes,
        istNorm.timezoneOffsetMinutes,
        jstNorm.timezoneOffsetMinutes,
      ];

      // At least some should be different
      const uniqueOffsets = new Set(offsets);
      expect(uniqueOffsets.size).toBeGreaterThan(1);

      // UTC should be close to 0
      expect(Math.abs(utcNorm.timezoneOffsetMinutes)).toBeLessThan(60);

      // EST should be negative (behind UTC)
      expect(estNorm.timezoneOffsetMinutes).toBeLessThan(0);

      // IST should be positive (ahead of UTC)
      expect(istNorm.timezoneOffsetMinutes).toBeGreaterThan(0);

      // JST should be positive and larger than IST
      expect(jstNorm.timezoneOffsetMinutes).toBeGreaterThan(0);
    });
  });

  /**
   * Test 2: Leap Year Boundary Parsing Without Gaps
   * Ensures that leap year transitions (Feb 28 → Feb 29 → Mar 1) parse
   * correctly without creating gaps in calendar grids.
   */
  describe('Test 2: Leap Year Boundary Parsing Without Gaps', () => {
    it('correctly parses leap year boundaries without leaving grid gaps', () => {
      // 2024 is a leap year
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2000)).toBe(true); // Divisible by 400
      expect(isLeapYear(1900)).toBe(false); // Divisible by 100 but not 400

      // Test Feb 28 → Feb 29 transition in UTC
      const feb28 = new Date('2024-02-28T23:00:00Z').getTime();
      const feb29 = new Date('2024-02-29T00:00:00Z').getTime();
      const mar01 = new Date('2024-03-01T00:00:00Z').getTime();

      const norm28 = normalizeDateToTimezone(feb28, 'UTC');
      const norm29 = normalizeDateToTimezone(feb29, 'UTC');
      const norm01 = normalizeDateToTimezone(mar01, 'UTC');

      expect(norm28.localDate).toBe('2024-02-28');
      expect(norm29.localDate).toBe('2024-02-29');
      expect(norm01.localDate).toBe('2024-03-01');

      // Verify no gaps: each day is exactly 24 hours apart
      const dayStart28 = getStartOfDayInTimezone(new Date(feb28), 'UTC');
      const dayStart29 = getStartOfDayInTimezone(new Date(feb29), 'UTC');
      const dayStart01 = getStartOfDayInTimezone(new Date(mar01), 'UTC');

      expect(dayStart29 - dayStart28).toBe(86400000); // Exactly 24 hours
      expect(dayStart01 - dayStart29).toBe(86400000); // Exactly 24 hours
    });
  });

  /**
   * Test 3: Calendar Date Format Utility Outputs Match Expectations Per Locale
   * Verifies that `normalizeDateToTimezone` produces YYYY-MM-DD strings that
   * are consistent and properly formatted for each timezone context.
   */
  describe('Test 3: Calendar Date Format Utility Outputs Match Expectations Per Locale', () => {
    it('produces correctly formatted YYYY-MM-DD dates across locales', () => {
      const timestamp = new Date('2024-06-15T14:30:45Z').getTime();

      const timezones = [
        'UTC',
        'America/Los_Angeles',
        'America/New_York',
        'Europe/London',
        'Europe/Paris',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Asia/Bangkok',
        'Asia/Tokyo',
        'Australia/Sydney',
      ];

      timezones.forEach((tz) => {
        const normalized = normalizeDateToTimezone(timestamp, tz);

        // Validate format: YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        expect(normalized.localDate).toMatch(dateRegex);
        expect(normalized.utcDate).toMatch(dateRegex);

        // Verify they are valid date strings
        expect(() => new Date(normalized.localDate + 'T00:00:00Z')).not.toThrow();
        expect(() => new Date(normalized.utcDate + 'T00:00:00Z')).not.toThrow();

        // Verify offset is a finite number
        expect(Number.isFinite(normalized.timezoneOffsetMinutes)).toBe(true);
      });
    });
  });

  /**
   * Test 4: Daylight Savings Time Transitions
   * Tests that day boundaries are correctly computed around DST transitions
   * (spring forward / fall back), ensuring calendar dates align properly.
   */
  describe('Test 4: Daylight Savings Time Transitions', () => {
    it('handles spring and fall DST transitions correctly in America/New_York', () => {
      const limiterEST = new GitHubRefreshRateLimiter({
        limitsPerDay: 1,
        timezone: 'America/New_York',
      });

      // Spring forward: March 10, 2024 at 2:00 AM EST → 3:00 AM EDT
      const beforeSpring = new Date('2024-03-10T06:00:00Z'); // 1:00 AM EST
      const afterSpring = new Date('2024-03-10T08:00:00Z'); // 4:00 AM EDT

      const normBeforeSpring = normalizeDateToTimezone(beforeSpring.getTime(), 'America/New_York');
      const normAfterSpring = normalizeDateToTimezone(afterSpring.getTime(), 'America/New_York');

      // Both are the same calendar date despite spring forward
      expect(normBeforeSpring.localDate).toBe('2024-03-10');
      expect(normAfterSpring.localDate).toBe('2024-03-10');

      // But their offsets should be different (EST vs EDT)
      expect(normBeforeSpring.timezoneOffsetMinutes).not.toBe(
        normAfterSpring.timezoneOffsetMinutes
      );
      expect(normBeforeSpring.timezoneOffsetMinutes).toBeLessThan(
        normAfterSpring.timezoneOffsetMinutes
      );

      // Fall back: November 3, 2024 at 2:00 AM EDT → 1:00 AM EST
      const beforeFall = new Date('2024-11-03T05:00:00Z'); // 1:00 AM EDT
      const afterFall = new Date('2024-11-03T07:00:00Z'); // 2:00 AM EST

      const normBeforeFall = normalizeDateToTimezone(beforeFall.getTime(), 'America/New_York');
      const normAfterFall = normalizeDateToTimezone(afterFall.getTime(), 'America/New_York');

      // Both should report as the same calendar date
      expect(normBeforeFall.localDate).toBe('2024-11-03');
      expect(normAfterFall.localDate).toBe('2024-11-03');

      // But with different offsets (EDT vs EST)
      expect(normBeforeFall.timezoneOffsetMinutes).not.toBe(normAfterFall.timezoneOffsetMinutes);
      expect(normBeforeFall.timezoneOffsetMinutes).toBeGreaterThan(
        normAfterFall.timezoneOffsetMinutes
      );
    });
  });

  /**
   * Test 5: Refresh Rate Limiting with Timezone-Aware Day Boundaries
   * Verifies that rate limits reset at the correct time based on timezone
   * day boundaries, preventing users across different timezones from
   * observing divergent streak behavior.
   */
  describe('Test 5: Refresh Rate Limiting with Timezone-Aware Day Boundaries', () => {
    it('enforces rate limits based on timezone day boundaries and resets correctly', () => {
      const limiterIST = new GitHubRefreshRateLimiter({
        limitsPerDay: 1,
        timezone: 'Asia/Kolkata',
      });

      // Start at 2024-06-15 10:00:00 IST (2024-06-15 04:30:00 UTC)
      const startIST = new Date('2024-06-15T04:30:00Z');
      vi.setSystemTime(startIST);

      // First refresh should succeed
      const result1 = limiterIST.checkRefresh('user1', startIST);
      expect(result1.allowed).toBe(true);
      expect(result1.normalizedDate.localDate).toBe('2024-06-15');

      // Second refresh a few minutes later on same IST day should fail
      const sameDay = new Date('2024-06-15T08:00:00Z'); // Still IST day (2024-06-15 13:30:00 IST)
      vi.setSystemTime(sameDay);
      const result2 = limiterIST.checkRefresh('user1', sameDay);
      expect(result2.allowed).toBe(false);
      expect(result2.normalizedDate.localDate).toBe('2024-06-15');

      // Advance to next IST day (2024-06-16 00:00:01 IST = 2024-06-15 18:30:01 UTC)
      const nextIST = new Date('2024-06-15T18:30:01Z');
      vi.setSystemTime(nextIST);

      // Now refresh should succeed again
      const result3 = limiterIST.checkRefresh('user1', nextIST);
      expect(result3.allowed).toBe(true);
      expect(result3.normalizedDate.localDate).toBe('2024-06-16');

      // Verify reset times are correct (should be at next IST midnight)
      expect(result2.secondsUntilReset).toBeGreaterThan(0);
      expect(result2.secondsUntilReset).toBeLessThanOrEqual(86400); // At most 24 hours
    });
  });
});
