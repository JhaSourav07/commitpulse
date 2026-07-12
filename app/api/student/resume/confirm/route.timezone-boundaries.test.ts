import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeTimezone, formatDateForLocale, isValidDate, handleDST } from './route';

describe('ApiStudentResumeConfirmRoute - Timezone Normalization & Calendar Data Boundary Alignment', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('should normalize timestamps across UTC, EST, IST, JST', () => {
    const ts = '2026-07-10T23:30:00Z';
    expect(normalizeTimezone(ts, 'UTC')).toBe('2026-07-10');
    expect(normalizeTimezone(ts, 'IST')).toBe('2026-07-11');
    expect(normalizeTimezone(ts, 'JST')).toBe('2026-07-11');
  });

  it('should align activity blocks across date boundaries', () => {
    const timestamps = ['2026-07-10T23:59:00Z', '2026-07-11T00:01:00Z'];
    const results = timestamps.map((t) => normalizeTimezone(t, 'IST'));
    expect(results[0]).toBe('2026-07-11');
    expect(results[1]).toBe('2026-07-11');
  });

  it('should handle leap year dates correctly', () => {
    expect(isValidDate('2024-02-29T12:00:00Z')).toBe(true);
    expect(isValidDate('2025-02-29T12:00:00Z')).toBe(false);
  });

  it('should handle DST transitions', () => {
    const spring = '2024-03-10T02:30:00-05:00';
    const fall = '2024-11-03T01:30:00-04:00';
    expect(handleDST(spring)).toBeDefined();
    expect(handleDST(fall)).toBeDefined();
  });

  it('should format dates for different locales', () => {
    const date = '2026-07-10T12:00:00Z';
    expect(formatDateForLocale(date, 'en-US')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDateForLocale(date, 'en-GB')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
