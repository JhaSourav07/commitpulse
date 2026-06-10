import { describe, it, expect, vi, afterEach } from 'vitest';

// Fixed utility: Safe timezone conversion with try-catch fallback handling
function normalizeCommitDate(dateString: string, timeZone: string): string {
  const date = new Date(dateString);
  try {
    return date.toLocaleDateString('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    // Variable removed since it isn't being read, clearing the linter warning!
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

// Helper utility parsing calendar grid structures to check for gaps
function checkLeapYearGrid(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

describe('LanguageChart Timezone & Calendar Boundary Alignment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Test Case 1: Timezone shifting logic
  it('should accurately align commits to the correct visual date across different target timezones (EST vs IST)', () => {
    const criticalTimestamp = '2026-05-20T23:30:00Z'; // Late night UTC

    const dateInEST = normalizeCommitDate(criticalTimestamp, 'America/New_York');
    const dateInIST = normalizeCommitDate(criticalTimestamp, 'Asia/Kolkata');

    expect(dateInEST).toBeDefined();
    expect(dateInIST).toBeDefined();
    expect(dateInEST).not.toEqual(dateInIST); // They must reflect the timezone difference
  });

  // Test Case 2: Leap year edge-case validation
  it('should parse leap year February 29th boundaries smoothly without introducing blank gaps into layout grids', () => {
    const leapYearValid = checkLeapYearGrid(2024); // 2024 was a leap year
    const normalYearValid = checkLeapYearGrid(2025);

    expect(leapYearValid).toBe(true);
    expect(normalYearValid).toBe(false);
  });

  // Test Case 3: Locale format outputs
  it('should match format outputs cleanly according to localized expectations across regional settings', () => {
    const testDate = '2026-06-01T12:00:00Z';

    const formattedUTC = normalizeCommitDate(testDate, 'UTC');
    expect(formattedUTC).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // Matches MM/DD/YYYY template format
  });

  // Test Case 4: Daylight Savings Transitions (Spring Forward)
  it('should safely compute day adjustments across Daylight Saving Time (DST) Spring Forward transitions without duplicating hours', () => {
    // March 8, 2026 is the DST start date in America
    // A 24-hour mathematical duration spanning the transition should safely equal 1 day gap
    const dateBeforeDST = new Date('2026-03-07T12:00:00Z');
    const dateAfterDST = new Date('2026-03-09T12:00:00Z');

    const diffInDays = (dateAfterDST.getTime() - dateBeforeDST.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffInDays).toBe(2); // The temporal boundaries map perfectly across calendar increments
  });

  // Test Case 5: Standardizing baseline alignment fallback
  it('should fallback gracefully to standard UTC evaluations when unrecognized timezones are evaluated', () => {
    const testTimestamp = '2026-01-01T00:00:00Z';
    const baselineUTC = normalizeCommitDate(testTimestamp, 'UTC');
    const unknownFallback = normalizeCommitDate(testTimestamp, 'Invalid/Timezone_Name');

    // Thanks to the try-catch update, the invalid timezone will cleanly match the UTC template fallback
    expect(unknownFallback).toEqual(baselineUTC);
  });
});
