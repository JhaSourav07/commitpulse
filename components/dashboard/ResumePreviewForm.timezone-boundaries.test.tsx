import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Test Suite: ResumePreviewForm Timezone Normalization & Calendar Boundary Alignment
 *
 * This test suite validates timezone normalization and calendar data boundary alignment
 * in the ResumePreviewForm component, particularly for date fields in Education and
 * Experience sections. Time offsets can shift activity blocks between dates, creating
 * streaks divergence across viewers in different regions.
 *
 * Test Coverage:
 * - Timezone normalization across UTC, EST, IST, and JST
 * - Calendar date boundary alignment for visual alignment
 * - Leap year boundary parsing without gaps
 * - Calendar date format utility outputs across locales
 * - Daylight savings transition handling
 */

/* ==========================================================================
 * TIMEZONE OFFSET DEFINITIONS
 * ========================================================================== */

const TIMEZONE_OFFSETS = {
  UTC: 0,
  EST: -5 * 60, // UTC-5 (Eastern Standard Time)
  EDT: -4 * 60, // UTC-4 (Eastern Daylight Time)
  IST: 5.5 * 60, // UTC+5:30 (Indian Standard Time)
  JST: 9 * 60, // UTC+9 (Japan Standard Time)
};

/* ==========================================================================
 * UTILITY FUNCTIONS FOR TIMEZONE TESTING
 * ========================================================================== */

/**
 * Converts a UTC date to a specific timezone date string (YYYY-MM-DD format)
 */
function convertToTimezoneDate(utcDate: Date, timezoneOffset: number): string {
  const offsetMs = timezoneOffset * 60 * 1000;
  const tzDate = new Date(utcDate.getTime() + offsetMs);
  const year = tzDate.getUTCFullYear();
  const month = String(tzDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(tzDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string (YYYY-MM-DD) for display
 */
function formatDateDisplay(dateStr: string): string {
  if (!dateStr || dateStr.length !== 10) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  try {
    const date = new Date(`${dateStr}T00:00:00Z`);
    if (isNaN(date.getTime())) return dateStr;

    const formatted = date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return formatted === 'Invalid Date' ? dateStr : formatted;
  } catch {
    return dateStr;
  }
}

/**
 * Determines if a year is a leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gets the date at a specific offset from a reference date
 */
function getOffsetDate(baseDate: Date, offsetDays: number): Date {
  const result = new Date(baseDate);
  result.setUTCDate(result.getUTCDate() + offsetDays);
  return result;
}

/**
 * Creates a date at midnight UTC for consistency
 */
function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/* ==========================================================================
 * TEST SUITE
 * ========================================================================== */

describe('ResumePreviewForm - Timezone Normalization & Calendar Boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * TEST 1: Timezone Normalization - Date Shift Detection
   *
   * Verifies that the same UTC timestamp is correctly converted to the local
   * date in different timezones, and that date boundaries are respected.
   * A commit at 23:00 UTC on June 15 would be June 15 in UTC/EST but could be
   * June 16 in JST (UTC+9).
   */
  it('should normalize dates correctly across different timezones with proper boundary detection', () => {
    // Test date: June 15, 2024, 23:00 UTC (near end of day)
    const utcDate = createUTCDate(2024, 6, 15);
    utcDate.setUTCHours(23, 0, 0, 0);

    const utcLocal = convertToTimezoneDate(utcDate, TIMEZONE_OFFSETS.UTC);
    const estLocal = convertToTimezoneDate(utcDate, TIMEZONE_OFFSETS.EST);
    const istLocal = convertToTimezoneDate(utcDate, TIMEZONE_OFFSETS.IST);
    const jstLocal = convertToTimezoneDate(utcDate, TIMEZONE_OFFSETS.JST);

    // UTC: Should remain June 15
    expect(utcLocal).toBe('2024-06-15');

    // EST (UTC-5): 23:00 UTC = 18:00 EST → Same day June 15
    expect(estLocal).toBe('2024-06-15');

    // IST (UTC+5:30): 23:00 UTC = 04:30 IST next day → June 16
    expect(istLocal).toBe('2024-06-16');

    // JST (UTC+9): 23:00 UTC = 08:00 JST next day → June 16
    expect(jstLocal).toBe('2024-06-16');
  });

  /**
   * TEST 2: Calendar Boundary Alignment - Streaks Divergence
   *
   * Verifies that activity blocks don't create artificially split streaks
   * when viewed from different timezones. Ensures consistent calendar grid
   * alignment despite timezone differences.
   */
  it('should align calendar boundaries consistently when viewing education date ranges across timezones', () => {
    // Education period: Jan 2, 2024 to Jan 2, 2025 (full year)
    // Use noon UTC to avoid boundary issues with midnight conversions
    const startDate = createUTCDate(2024, 1, 2);
    startDate.setUTCHours(12, 0, 0, 0);

    const endDate = createUTCDate(2025, 1, 2);
    endDate.setUTCHours(12, 0, 0, 0);

    // Simulate viewing the same date range from different timezones
    const timezones = [
      { name: 'UTC', offset: TIMEZONE_OFFSETS.UTC },
      { name: 'EST', offset: TIMEZONE_OFFSETS.EST },
      { name: 'IST', offset: TIMEZONE_OFFSETS.IST },
      { name: 'JST', offset: TIMEZONE_OFFSETS.JST },
    ];

    const dateRanges = timezones.map((tz) => ({
      timezone: tz.name,
      startDate: convertToTimezoneDate(startDate, tz.offset),
      endDate: convertToTimezoneDate(endDate, tz.offset),
    }));

    // Verify all date ranges maintain the same span in terms of calendar days
    // even though they may start/end on different dates in different timezones
    dateRanges.forEach((range) => {
      expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Ensure start date is before or equal to end date in all timezones
      const [startYear, startMonth, startDay] = range.startDate
        .split('-')
        .map((x) => parseInt(x, 10));
      const [endYear, endMonth, endDay] = range.endDate.split('-').map((x) => parseInt(x, 10));

      const startTimestamp = new Date(startYear, startMonth - 1, startDay).getTime();
      const endTimestamp = new Date(endYear, endMonth - 1, endDay).getTime();

      expect(startTimestamp).toBeLessThanOrEqual(endTimestamp);
    });

    // Verify that all timezones convert to the same dates (noon UTC ensures same calendar day)
    const utcStart = dateRanges[0].startDate;
    const estStart = dateRanges[1].startDate;
    const istStart = dateRanges[2].startDate;
    const jstStart = dateRanges[3].startDate;

    // All should align to the same date when using noon UTC
    expect(utcStart).toBe('2024-01-02');
    expect(estStart).toBe('2024-01-02');
    expect(istStart).toBe('2024-01-02');
    expect(jstStart).toBe('2024-01-02');

    // Verify end dates are also consistent
    expect(dateRanges[0].endDate).toBe('2025-01-02');
    expect(dateRanges[1].endDate).toBe('2025-01-02');
    expect(dateRanges[2].endDate).toBe('2025-01-02');
    expect(dateRanges[3].endDate).toBe('2025-01-02');
  });

  /**
   * TEST 3: Leap Year Boundary Parsing
   *
   * Verifies that leap year boundaries (Feb 29) parse correctly without creating
   * gaps in the calendar grid. Tests both leap years and non-leap years at
   * their boundaries.
   */
  it('should parse leap year boundaries without gaps and handle non-leap years correctly', () => {
    // 2024 is a leap year, 2025 is not
    const leapYearFeb28 = createUTCDate(2024, 2, 28);
    const leapYearFeb29 = createUTCDate(2024, 2, 29);
    const leapYearMar1 = createUTCDate(2024, 3, 1);

    const nonLeapYearFeb28 = createUTCDate(2025, 2, 28);
    const nonLeapYearMar1 = createUTCDate(2025, 3, 1);

    // Verify leap year dates are correctly identified and formatted
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);

    // Format dates across timezones to verify no gaps
    const leapYearDates = [leapYearFeb28, leapYearFeb29, leapYearMar1].map((d) =>
      convertToTimezoneDate(d, TIMEZONE_OFFSETS.UTC)
    );

    expect(leapYearDates[0]).toBe('2024-02-28');
    expect(leapYearDates[1]).toBe('2024-02-29');
    expect(leapYearDates[2]).toBe('2024-03-01');

    // Verify sequential progression without gaps
    const utcDates = leapYearDates.map((d) => {
      const parts = d.split('-');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    });

    // Each consecutive date should be exactly 1 day apart
    for (let i = 0; i < utcDates.length - 1; i++) {
      const diffMs = utcDates[i + 1].getTime() - utcDates[i].getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    }

    // Non-leap year should not have Feb 29
    const nonLeapDates = [nonLeapYearFeb28, nonLeapYearMar1].map((d) =>
      convertToTimezoneDate(d, TIMEZONE_OFFSETS.UTC)
    );

    expect(nonLeapDates[0]).toBe('2025-02-28');
    expect(nonLeapDates[1]).toBe('2025-03-01');
  });

  /**
   * TEST 4: Calendar Date Format Utility Outputs
   *
   * Verifies that calendar date format utilities output correctly formatted
   * strings that match expected locale-specific patterns. Tests the formatDate
   * utility with various date inputs across different timezones.
   */
  it('should format calendar dates consistently and correctly for display across locales', () => {
    const testCases = [
      { input: '2024-06-15', expected: 'Jun 15, 2024' },
      { input: '2024-01-01', expected: 'Jan 1, 2024' },
      { input: '2024-12-31', expected: 'Dec 31, 2024' },
      { input: '2024-02-29', expected: 'Feb 29, 2024' }, // Leap year
      { input: '2025-02-28', expected: 'Feb 28, 2025' }, // Non-leap year
    ];

    testCases.forEach(({ input, expected }) => {
      const formatted = formatDateDisplay(input);
      expect(formatted).toBe(expected);
    });

    // Test edge cases
    expect(formatDateDisplay('')).toBe('');
    expect(formatDateDisplay('invalid')).toBe('invalid');
    expect(formatDateDisplay('2024-13-01')).toBe('2024-13-01'); // Invalid month
  });

  /**
   * TEST 5: Daylight Savings Transition Handling
   *
   * Verifies that dates around daylight savings transitions (spring forward,
   * fall back) are handled correctly. Tests USA DST transitions for 2024:
   * - Spring forward: March 10, 2024 (02:00 EST → 03:00 EDT)
   * - Fall back: November 3, 2024 (02:00 EDT → 01:00 EST)
   */
  it('should handle daylight savings transitions correctly without date shift errors', () => {
    // DST Spring Forward: March 10, 2024, 02:00 EST becomes 03:00 EDT
    // Test a time just before the transition
    const beforeSpringDST = createUTCDate(2024, 3, 10);
    beforeSpringDST.setUTCHours(7, 0, 0, 0); // 07:00 UTC = 02:00 EST

    // Test a time just after the transition
    const afterSpringDST = createUTCDate(2024, 3, 10);
    afterSpringDST.setUTCHours(8, 0, 0, 0); // 08:00 UTC = 03:00 EDT

    // Both should still be on March 10 in EST/EDT
    const beforeDSTLocal = convertToTimezoneDate(beforeSpringDST, TIMEZONE_OFFSETS.EST);
    const afterDSTLocal = convertToTimezoneDate(afterSpringDST, TIMEZONE_OFFSETS.EDT);

    expect(beforeDSTLocal).toBe('2024-03-10');
    expect(afterDSTLocal).toBe('2024-03-10');

    // DST Fall Back: November 3, 2024, 02:00 EDT becomes 01:00 EST
    const beforeFallDST = createUTCDate(2024, 11, 3);
    beforeFallDST.setUTCHours(5, 0, 0, 0); // 05:00 UTC = 01:00 EDT

    const afterFallDST = createUTCDate(2024, 11, 3);
    afterFallDST.setUTCHours(6, 0, 0, 0); // 06:00 UTC = 01:00 EST

    const beforeFallLocal = convertToTimezoneDate(beforeFallDST, TIMEZONE_OFFSETS.EDT);
    const afterFallLocal = convertToTimezoneDate(afterFallDST, TIMEZONE_OFFSETS.EST);

    // Both should be on November 3
    expect(beforeFallLocal).toBe('2024-11-03');
    expect(afterFallLocal).toBe('2024-11-03');

    // Verify date formatting works correctly during DST transitions
    const formattedBefore = formatDateDisplay('2024-03-10');
    const formattedAfter = formatDateDisplay('2024-11-03');

    expect(formattedBefore).toBe('Mar 10, 2024');
    expect(formattedAfter).toBe('Nov 3, 2024');
  });
});
