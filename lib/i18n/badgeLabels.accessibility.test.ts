import { describe, expect, it } from 'vitest';
import { labels, supportedLanguages, getLabels } from './badgeLabels';

describe('badgeLabels accessibility', () => {
  it('should export badge labels', () => {
    expect(labels).toBeDefined();
    expect(typeof labels).toBe('object');
  });

  it('should contain readable labels', () => {
    Object.values(labels).forEach((languageLabels) => {
      Object.values(languageLabels).forEach((label) => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  it('should provide screen reader friendly text', () => {
    Object.values(labels).forEach((languageLabels) => {
      Object.values(languageLabels).forEach((label) => {
        expect(label).not.toContain('<');
        expect(label).not.toContain('>');
      });
    });
  });

  it('should maintain consistent label structure', () => {
    Object.values(labels).forEach((languageLabels) => {
      expect(Object.keys(languageLabels)).toEqual(
        expect.arrayContaining([
          'CURRENT_STREAK',
          'ANNUAL_SYNC_TOTAL',
          'PEAK_STREAK',
          'COMMITS_THIS_MONTH',
          'VS_LAST_MONTH',
        ])
      );
    });
  });

  it('should support keyboard accessible usage through stable labels', () => {
    expect(supportedLanguages.length).toBeGreaterThan(0);

    supportedLanguages.forEach((lang) => {
      const result = getLabels(lang);
      expect(result).toBeDefined();
      expect(typeof result.CURRENT_STREAK).toBe('string');
    });
  });
});
