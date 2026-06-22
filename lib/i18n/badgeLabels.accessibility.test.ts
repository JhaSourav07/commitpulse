import { describe, expect, it } from 'vitest';
import { getLabels, labels, supportedLanguages } from './badgeLabels';

describe('badgeLabels accessibility compliance', () => {
  it('should provide all required label keys for every supported language', () => {
    const requiredKeys = [
      'CURRENT_STREAK',
      'ANNUAL_SYNC_TOTAL',
      'PEAK_STREAK',
      'COMMITS_THIS_MONTH',
      'VS_LAST_MONTH',
    ];

    supportedLanguages.forEach((lang) => {
      const languageLabels = labels[lang];

      requiredKeys.forEach((key) => {
        expect(languageLabels).toHaveProperty(key);
      });
    });
  });

  it('should provide non-empty accessible text for every label', () => {
    supportedLanguages.forEach((lang) => {
      const languageLabels = labels[lang];

      Object.values(languageLabels).forEach((value) => {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('should return localized labels for supported languages', () => {
    expect(getLabels('hi').CURRENT_STREAK).toBe('वर्तमान_स्ट्रीक');
    expect(getLabels('zh').CURRENT_STREAK).toBe('当前连续记录');
    expect(getLabels('ja').CURRENT_STREAK).toBe('現在のストリーク');
  });

  it('should support case-insensitive language lookup', () => {
    expect(getLabels('EN')).toEqual(labels.en);
    expect(getLabels('Hi')).toEqual(labels.hi);
    expect(getLabels('ZH')).toEqual(labels.zh);
  });

  it('should fall back to english when language is unsupported', () => {
    expect(getLabels('unknown')).toEqual(labels.en);
    expect(getLabels('xyz')).toEqual(labels.en);
  });

  it('should ensure every language contains meaningful screen-reader text', () => {
    supportedLanguages.forEach((lang) => {
      const languageLabels = getLabels(lang);

      Object.entries(languageLabels).forEach(([key, value]) => {
        expect(value).toBeTruthy();
        expect(value.trim()).not.toHaveLength(0);

        if (key === 'COMMITS_THIS_MONTH') {
          expect(value.length).toBeGreaterThan(2);
        }
      });
    });
  });

  it('should expose supported languages that map to existing translations', () => {
    supportedLanguages.forEach((lang) => {
      expect(labels[lang]).toBeDefined();
    });
  });
});
