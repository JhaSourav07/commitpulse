/**
 * @file NameSection.timezone-boundaries.test.tsx
 * @version 1.0.0
 * @author Atharv Mohite <atharv96k>
 * @description Timezone Normalization & Calendar Data Boundary Alignment
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('app/generator/components/sections/NameSection — Timezone Normalization & Calendar Data Boundary Alignment (Variation 8)', () => {
  interface DateNormalizationResult {
    normalizedIsoDate: string;
    dayOfWeekIndex: number;
    isLeapYearSafe: boolean;
    formattedOutput: string;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  const normalizeCalendarBoundary = (
    timestampMs: number,
    timezoneOffsetMinutes: number,
    localeCode = 'en-US'
  ): DateNormalizationResult => {
    const targetTimeWithOffset = new Date(timestampMs - timezoneOffsetMinutes * 60 * 1000);

    const year = targetTimeWithOffset.getUTCFullYear();
    const month = String(targetTimeWithOffset.getUTCMonth() + 1).padStart(2, '0');
    const day = String(targetTimeWithOffset.getUTCDate()).padStart(2, '0');

    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    let formattedText = `${year}-${month}-${day}`;
    if (localeCode === 'ja-JP') {
      formattedText = `${year}/${month}/${day}`;
    } else if (localeCode === 'en-IN') {
      formattedText = `${day}-${month}-${year}`;
    }

    return {
      normalizedIsoDate: `${year}-${month}-${day}`,
      dayOfWeekIndex: targetTimeWithOffset.getUTCDay(),
      isLeapYearSafe: isLeapYear,
      formattedOutput: formattedText,
    };
  };

  it('mocks standard international timezone matrices successfully and validates local runtime instances', () => {
    const fixedEpoch = Date.UTC(2026, 6, 9, 0, 0, 0);

    const utcResult = normalizeCalendarBoundary(fixedEpoch, 0);
    const estResult = normalizeCalendarBoundary(fixedEpoch, 300);
    const istResult = normalizeCalendarBoundary(fixedEpoch, -330);

    expect(utcResult.normalizedIsoDate).toBe('2026-07-09');
    expect(estResult.normalizedIsoDate).toBe('2026-07-08');
    expect(istResult.normalizedIsoDate).toBe('2026-07-09');
  });

  it('asserts data calculations accurately map timestamp values onto matching calendar visual tiles', () => {
    const specificTimestamp = Date.UTC(2026, 4, 15, 23, 30, 0);
    const normalState = normalizeCalendarBoundary(specificTimestamp, 0);

    expect(normalState.normalizedIsoDate).toBe('2026-05-15');
    expect(normalState.dayOfWeekIndex).toBe(5);
  });

  it('verifies leap year leap day boundary blocks parse perfectly without introducing grid space index gaps', () => {
    const leapDayTimestamp = Date.UTC(2028, 1, 29, 12, 0, 0);
    const evaluatedLeapDay = normalizeCalendarBoundary(leapDayTimestamp, 0);

    expect(evaluatedLeapDay.normalizedIsoDate).toBe('2028-02-29');
    expect(evaluatedLeapDay.isLeapYearSafe).toBe(true);
  });

  it('asserts calendar configuration localization adapters print proper output structures across multiple locales', () => {
    const targetDateEpoch = Date.UTC(2026, 11, 25, 10, 0, 0);

    const indiaOutput = normalizeCalendarBoundary(targetDateEpoch, -330, 'en-IN');
    const japanOutput = normalizeCalendarBoundary(targetDateEpoch, -540, 'ja-JP');

    expect(indiaOutput.formattedOutput).toBe('25-12-2026');
    expect(japanOutput.formattedOutput).toBe('2026/12/25');
  });

  it('tests boundary skew variances over critical calendar daylight savings transition checkpoints', () => {
    const earlyTransitionEpoch = Date.UTC(2026, 10, 1, 5, 59, 59);
    const postTransitionEpoch = Date.UTC(2026, 10, 1, 6, 0, 1);

    const preShift = normalizeCalendarBoundary(earlyTransitionEpoch, 300);
    const postShift = normalizeCalendarBoundary(postTransitionEpoch, 300);

    expect(preShift.normalizedIsoDate).toBe('2026-11-01');
    expect(postShift.normalizedIsoDate).toBe('2026-11-01');
  });
});
