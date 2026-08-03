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

    it('returns 0 for partial ISO date strings', () => {
      expect(getAuthorLocalHour('2024-01-01')).toBe(0);
      expect(getAuthorLocalHour('2024-01-01T')).toBe(0);
      expect(getAuthorLocalHour('2024-01-01T12')).toBe(0);
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

    it('returns 0 for malformed date formats', () => {
      expect(getViewerLocalHour('2024-01-01')).toBe(0);
      expect(getViewerLocalHour('not-a-date')).toBe(0);
      expect(getViewerLocalHour('2024-')).toBe(0);
    });
  });

  describe('processCommitTimestamps', () => {
    it('returns zeroed metrics for empty array', () => {
      const result = processCommitTimestamps([]);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });

    it('returns zeroed metrics when all dates are invalid', () => {
      const result = processCommitTimestamps(['invalid', '', 'also-invalid'] as string[]);
      expect(result).toEqual({ morning: 0, afternoon: 0, evening: 0, night: 0 });
    });
  });
});
