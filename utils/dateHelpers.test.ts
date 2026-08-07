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
      // Valid ISO format extracts hour from substring
      expect(getAuthorLocalHour('2024-03-10T15:30:00Z')).toBe(15);
      // Non-ISO format strings fall back to Date parsing
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

    it('returns zero metrics when all dates are invalid', () => {
      const result = processCommitTimestamps(['invalid-date', 'not-a-date', '']);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zero metrics when all dates are null or undefined', () => {
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

    it('counts valid morning commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T09:00:00', '2024-03-10T11:30:00']);
      expect(result.morning).toBe(2);
      expect(result.afternoon).toBe(0);
      expect(result.evening).toBe(0);
      expect(result.night).toBe(0);
    });

    it('counts valid afternoon commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T12:00:00', '2024-03-10T17:59:00']);
      expect(result.morning).toBe(0);
      expect(result.afternoon).toBe(2);
    });

    it('counts valid evening commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T18:00:00', '2024-03-10T23:59:00']);
      expect(result.evening).toBe(2);
    });

    it('counts valid night commits correctly', () => {
      const result = processCommitTimestamps(['2024-03-10T00:00:00', '2024-03-10T05:59:00']);
      expect(result.night).toBe(2);
    });

    it('ignores invalid dates while counting valid ones', () => {
      const result = processCommitTimestamps([
        '2024-03-10T09:00:00',
        'invalid-date',
        '2024-03-10T14:00:00',
      ]);
      expect(result.morning).toBe(1);
      expect(result.afternoon).toBe(1);
      expect(result.night).toBe(0);
      expect(result.evening).toBe(0);
    });
  });
});
