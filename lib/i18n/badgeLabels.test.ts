import { describe, it, expect } from 'vitest';
import { getLabels, labels } from './badgeLabels';

describe('getLabels', () => {
  describe('supported locales', () => {
    it('returns English labels for en', () => {
      const labels = getLabels('en');
      expect(labels.CURRENT_STREAK).toBe('CURRENT_STREAK');
      expect(labels.ANNUAL_SYNC_TOTAL).toBe('ANNUAL_SYNC_TOTAL');
      expect(labels.PEAK_STREAK).toBe('PEAK_STREAK');
    });

    it('returns Spanish labels for es', () => {
      const labels = getLabels('es');
      expect(labels.CURRENT_STREAK).toBe('RACHA_ACTUAL');
      expect(labels.ANNUAL_SYNC_TOTAL).toBe('TOTAL_ANUAL');
      expect(labels.PEAK_STREAK).toBe('RACHA_MÁXIMA');
    });

    it('returns Hindi labels for hi', () => {
      const labels = getLabels('hi');
      expect(labels.CURRENT_STREAK).toBe('वर्तमान_स्ट्रीक');
      expect(labels.ANNUAL_SYNC_TOTAL).toBe('वार्षिक_कुल');
      expect(labels.PEAK_STREAK).toBe('अधिकतम_स्ट्रीक');
    });

    it('returns French labels for fr', () => {
      const labels = getLabels('fr');
      expect(labels.CURRENT_STREAK).toBe('SÉRIE_ACTUELLE');
      expect(labels.ANNUAL_SYNC_TOTAL).toBe('TOTAL_ANNUEL');
      expect(labels.PEAK_STREAK).toBe('SÉRIE_MAXIMALE');
    });
  });

  describe('fallback behavior', () => {
    it('returns English labels when locale is undefined', () => {
      const labels = getLabels(undefined);
      expect(labels.CURRENT_STREAK).toBe('CURRENT_STREAK');
    });

    it('returns English labels for UNKNOWN_LOCALE', () => {
      const labels = getLabels('UNKNOWN_LOCALE');
      expect(labels.CURRENT_STREAK).toBe('CURRENT_STREAK');
    });

    it('returns English labels for empty string', () => {
      const labels = getLabels('');
      expect(labels.CURRENT_STREAK).toBe('CURRENT_STREAK');
    });
  });

  describe('object structure validation', () => {
    it('contains all required keys with defined string values', () => {
      const labels = getLabels('en');

      expect(labels).toHaveProperty('CURRENT_STREAK');
      expect(labels).toHaveProperty('ANNUAL_SYNC_TOTAL');
      expect(labels).toHaveProperty('PEAK_STREAK');

      expect(typeof labels.CURRENT_STREAK).toBe('string');
      expect(typeof labels.ANNUAL_SYNC_TOTAL).toBe('string');
      expect(typeof labels.PEAK_STREAK).toBe('string');
    });
    it('ensures all locale labels are non-empty strings', () => {
      for (const locale of Object.values(labels)) {
        for (const value of Object.values(locale)) {
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('monthly view keys', () => {
    it.each(Object.keys(labels))('locale %s has a non-empty COMMITS_THIS_MONTH', (lang) => {
      const locale = getLabels(lang);
      expect(locale.COMMITS_THIS_MONTH).toEqual(expect.stringMatching(/\S/));
    });

    it.each(Object.keys(labels))('locale %s has a non-empty VS_LAST_MONTH', (lang) => {
      const locale = getLabels(lang);
      expect(locale.VS_LAST_MONTH).toEqual(expect.stringMatching(/\S/));
    });
  });
});
