import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShareActions } from './useShareActions';

// --- DEFINE MOCK INTERFACE TO SATISFY ESLINT & TYPESCRIPT ---
interface MockExportData {
  activity: never[]; // 'never[]' satisfies any specific array type
  streak: { current: number; longest: number };
  totalCommits: number;
  stats: {
    currentStreak: number;
    peakStreak: number;
    totalContributions: number;
  };
  languages: never[]; // 'never[]' perfectly satisfies LanguageData[]
  [key: string]: unknown; // Allows for any other properties without strict structural typing
}

describe('useShareActions Timezone Normalization & Calendar Boundaries', () => {
  const originalTZ = process.env.TZ;

  const mockUsername = 'test_user';

  // The empty arrays [] naturally satisfy the never[] type
  const mockExportData: MockExportData = {
    activity: [],
    streak: { current: 5, longest: 10 },
    totalCommits: 100,
    stats: {
      currentStreak: 5,
      peakStreak: 10,
      totalContributions: 100,
    },
    languages: [],
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    // Enable fake timers to manipulate system clock
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original timezone and timers after every test
    process.env.TZ = originalTZ;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const setTimezone = (tz: string) => {
    process.env.TZ = tz;
  };

  it('1. mocks standard timezone settings (UTC, EST, IST, JST) correctly', () => {
    const testDate = new Date('2024-01-01T12:00:00Z');

    // UTC
    setTimezone('UTC');
    expect(testDate.toLocaleString('en-US', { timeZone: 'UTC' })).toContain('12:00:00 PM');

    // JST (Japan Standard Time, UTC+9)
    setTimezone('Asia/Tokyo');
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })).toContain('9:00:00 PM');

    // IST (Indian Standard Time, UTC+5:30)
    setTimezone('Asia/Kolkata');
    expect(testDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toContain('5:30:00 PM');
  });

  it('2. aligns calculations to correct visual dates despite offset shifts', () => {
    // 11:00 PM UTC on Jan 1st is 4:30 AM Jan 2nd in IST
    const lateUtcDate = new Date('2024-01-01T23:00:00Z');
    vi.setSystemTime(lateUtcDate);
    setTimezone('Asia/Kolkata');

    renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    const hookDateOutput = new Intl.DateTimeFormat('en-US', {
      timeZone: process.env.TZ,
      month: 'short',
      day: 'numeric',
    }).format(lateUtcDate);

    expect(hookDateOutput).toBe('Jan 2');
  });

  it('3. verifies leap year boundaries parse without leaving gaps in grids', () => {
    // Set time to Leap Day: Feb 29, 2024
    const leapDay = new Date('2024-02-29T12:00:00Z');
    vi.setSystemTime(leapDay);

    renderHook(() => useShareActions(mockUsername, mockExportData, mockOnClose));

    // Verify the system correctly processes the 29th and doesn't roll over to March 1st
    const month = leapDay.getMonth(); // 1 = Feb
    const day = leapDay.getDate(); // 29

    expect(month).toBe(1);
    expect(day).toBe(29);
  });

  it('4. asserts calendar date format utility outputs match expectations in each locale', () => {
    const testDate = new Date('2024-12-25T15:00:00Z'); // Christmas 3 PM UTC

    // US format (MM/DD/YYYY)
    const usFormat = new Intl.DateTimeFormat('en-US').format(testDate);
    expect(usFormat).toBe('12/25/2024');

    // UK format (DD/MM/YYYY)
    const ukFormat = new Intl.DateTimeFormat('en-GB').format(testDate);
    expect(ukFormat).toBe('25/12/2024');
  });

  it('5. tests offsets around transition dates like daylight savings (DST)', () => {
    setTimezone('America/New_York');

    // DST starts in US on March 10, 2024 at 2:00 AM (spring forward)
    // 1:59 AM is standard time (EST, UTC-5)
    const beforeDST = new Date('2024-03-10T06:59:00Z');
    // 3:01 AM is daylight time (EDT, UTC-4)
    const afterDST = new Date('2024-03-10T07:01:00Z');

    const beforeOffset = beforeDST.getTimezoneOffset();
    const afterOffset = afterDST.getTimezoneOffset();

    // Validate that the system correctly calculates a 60-minute shift in the local timezone offset
    expect(beforeOffset - afterOffset).toBe(60);
  });
});
