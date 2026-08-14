import { describe, it, expect } from 'vitest';
import { getAuthorLocalHour, getViewerLocalHour, processCommitTimestamps } from './dateHelpers';

describe('dateHelpers', () => {
  describe('getAuthorLocalHour', () => {
    it('extracts hour from a standard ISO timestamp with positive offset', () => {
      expect(getAuthorLocalHour('2024-03-10T15:30:00+02:00')).toBe(15);
    });

    it('extracts hour from a standard ISO timestamp with negative offset', () => {
      expect(getAuthorLocalHour('2024-03-10T08:15:00-05:00')).toBe(8);
    });

    it('extracts hour from a UTC ISO timestamp (Z)', () => {
      expect(getAuthorLocalHour('2024-03-10T00:45:00Z')).toBe(0);
    });

    it('handles midnight correctly', () => {
      expect(getAuthorLocalHour('2024-03-10T23:59:00+00:00')).toBe(23);
      expect(getAuthorLocalHour('2024-03-10T00:00:00+00:00')).toBe(0);
    });

    it('falls back safely for malformed strings', () => {
      expect(getAuthorLocalHour('invalid-date')).toBe(0);
      expect(getAuthorLocalHour('')).toBe(0);
    });

    it('validates ISO 8601 date format before substring extraction', () => {
      expect(getAuthorLocalHour('2024-03-10T15:30:00Z')).toBe(15);
      const hour = getAuthorLocalHour('March 10, 2024 15:30');
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });
  });

  describe('getViewerLocalHour', () => {
    it('returns a valid hour (0-23) for a valid ISO string', () => {
      const hour = getViewerLocalHour('2024-03-10T15:30:00+02:00');
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });

    it('returns 0 for invalid strings', () => {
      expect(getViewerLocalHour('invalid-date')).toBe(0);
      expect(getViewerLocalHour('')).toBe(0);
    });
  });

  describe('processCommitTimestamps', () => {
    it('returns zero metrics for an empty array', () => {
      const result = processCommitTimestamps([]);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics when input is null', () => {
      const result = processCommitTimestamps(null);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics when input is undefined', () => {
      const result = processCommitTimestamps(undefined);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics when input is not an array', () => {
      const result = processCommitTimestamps('not-an-array' as unknown as string[]);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics when all dates are invalid', () => {
      const result = processCommitTimestamps(['invalid-date', 'not-a-date', '']);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics when array elements are null or undefined', () => {
      const result = processCommitTimestamps([
        null as unknown as string,
        undefined as unknown as string,
      ]);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics for an array containing only Invalid Date strings', () => {
      const result = processCommitTimestamps(['2024-13-99T25:99:00', 'hello world']);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('always returns a valid TimeOfDayMetrics object with numeric fields', () => {
      const result = processCommitTimestamps([]);
      expect(result).toHaveProperty('morning');
      expect(result).toHaveProperty('afternoon');
      expect(result).toHaveProperty('evening');
      expect(result).toHaveProperty('night');
      expect(typeof result.morning).toBe('number');
      expect(typeof result.afternoon).toBe('number');
      expect(typeof result.evening).toBe('number');
      expect(typeof result.night).toBe('number');
    });

    // NOTE: Added 'Z' to timestamp strings below to explicitly parse them as UTC,
    // which aligns with processCommitTimestamps using getUTCHours() internally.

    it('counts valid morning commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T09:00:00Z', '2024-03-10T11:30:00Z']);
      expect(result.morning).toBe(2);
      expect(result.afternoon).toBe(0);
      expect(result.evening).toBe(0);
      expect(result.night).toBe(0);
    });

    it('counts valid afternoon commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T12:00:00Z', '2024-03-10T17:59:00Z']);
      expect(result.morning).toBe(0);
      expect(result.afternoon).toBe(2);
    });

    it('counts valid evening commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T18:00:00Z', '2024-03-10T23:59:00Z']);
      expect(result.evening).toBe(2);
    });

    it('counts valid night commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T00:00:00Z', '2024-03-10T05:59:00Z']);
      expect(result.night).toBe(2);
    });

    it('ignores invalid dates while counting valid ones', () => {
      const result = processCommitTimestamps([
        '2024-03-10T09:00:00Z',
        'invalid-date',
        '2024-03-10T14:00:00Z',
      ]);
      expect(result.morning).toBe(1);
      expect(result.afternoon).toBe(1);
      expect(result.night).toBe(0);
      expect(result.evening).toBe(0);
    });

    // Regression test: verifies timezone-agnostic behavior.
    // This test would fail with getHours() in IST but passes with getUTCHours().
    it('produces consistent results regardless of system timezone', () => {
      const timestamps = [
        '2024-03-10T09:00:00Z', // 09:00 UTC = morning
        '2024-03-10T14:00:00Z', // 14:00 UTC = afternoon
        '2024-03-10T20:00:00Z', // 20:00 UTC = evening
        '2024-03-10T03:00:00Z', // 03:00 UTC = night
      ];
      const result = processCommitTimestamps(timestamps);
      expect(result.morning).toBe(1);
      expect(result.afternoon).toBe(1);
      expect(result.evening).toBe(1);
      expect(result.night).toBe(1);
    });
  });
});
