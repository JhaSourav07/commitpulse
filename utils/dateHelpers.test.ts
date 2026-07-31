import { describe, it, expect } from 'vitest';
import { getAuthorLocalHour, getViewerLocalHour } from './dateHelpers';

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
});
