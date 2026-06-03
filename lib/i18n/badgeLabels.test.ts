import { describe, it, expect } from 'vitest';
import { getLabels, labels, detectLanguage } from './badgeLabels';

describe('detectLanguage', () => {
  it('returns en when acceptLanguage is null', () => {
    expect(detectLanguage(null)).toBe('en');
  });

  it('returns en when acceptLanguage is empty string', () => {
    expect(detectLanguage('')).toBe('en');
  });

  it('detects French from a simple fr code', () => {
    expect(detectLanguage('fr')).toBe('fr');
  });

  it('detects French from fr-CH', () => {
    expect(detectLanguage('fr-CH')).toBe('fr');
  });

  it('respects q-factor and picks the highest priority supported language', () => {
    // fr is 0.9, en is 0.8 -> should pick fr
    expect(detectLanguage('fr;q=0.9, en;q=0.8')).toBe('fr');
    // en is 0.9, fr is 0.8 -> should pick en
    expect(detectLanguage('en;q=0.9, fr;q=0.8')).toBe('en');
  });

  it('skips unsupported languages and picks the first supported one', () => {
    // xx is not supported, fr is supported
    expect(detectLanguage('xx, fr;q=0.9')).toBe('fr');
  });

  it('falls back to en if no supported language is found', () => {
    expect(detectLanguage('xx, yy;q=0.5')).toBe('en');
  });

  it('handles complex headers from real browsers', () => {
    const header = 'fr-CH, fr;q=0.9, en;q=0.8, *;q=0.5';
    expect(detectLanguage(header)).toBe('fr');
  });

  it('handles malformed headers gracefully by falling back to en', () => {
    expect(detectLanguage('!!!;;;,,,')).toBe('en');
  });
});

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
