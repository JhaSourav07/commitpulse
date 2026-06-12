import { describe, expect, it } from 'vitest';
import { getLabels, labels, supportedLanguages } from './badgeLabels';

describe('badgeLabels theme contrast', () => {
  it('contains all supported languages', () => {
    expect(supportedLanguages.length).toBeGreaterThan(0);

    supportedLanguages.forEach((lang) => {
      expect(labels[lang]).toBeDefined();
    });
  });

  it('each language contains all required badge label keys', () => {
    Object.values(labels).forEach((locale) => {
      expect(locale).toHaveProperty('CURRENT_STREAK');
      expect(locale).toHaveProperty('ANNUAL_SYNC_TOTAL');
      expect(locale).toHaveProperty('PEAK_STREAK');
      expect(locale).toHaveProperty('COMMITS_THIS_MONTH');
      expect(locale).toHaveProperty('VS_LAST_MONTH');
    });
  });

  it('returns english labels by default', () => {
    expect(getLabels()).toEqual(labels.en);
  });

  it('returns language labels using case-insensitive lookup', () => {
    expect(getLabels('HI')).toEqual(labels.hi);
    expect(getLabels('Fr')).toEqual(labels.fr);
  });

  it('falls back to english for unsupported languages', () => {
    expect(getLabels('unknown-language')).toEqual(labels.en);
  });
});
