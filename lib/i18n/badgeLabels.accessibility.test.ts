import { describe, expect, it } from 'vitest';
import { getLabels, labels, supportedLanguages } from './badgeLabels';

describe('badgeLabels accessibility compliance', () => {
  it('should provide all required accessible label keys', () => {
    const requiredKeys = [
      'CURRENT_STREAK',
      'ANNUAL_SYNC_TOTAL',
      'PEAK_STREAK',
      'COMMITS_THIS_MONTH',
      'VS_LAST_MONTH',
    ];

    supportedLanguages.forEach((lang) => {
      requiredKeys.forEach((key) => {
        expect(labels[lang]).toHaveProperty(key);
      });
    });
  });

  it('should provide non-empty screen reader text labels', () => {
    supportedLanguages.forEach((lang) => {
      Object.values(labels[lang]).forEach((label) => {
        expect(label.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('should return labels correctly for supported locales', () => {
    expect(getLabels('en')).toEqual(labels.en);
    expect(getLabels('hi')).toEqual(labels.hi);
    expect(getLabels('zh')).toEqual(labels.zh);
  });

  it('should support keyboard accessible language lookup through normalized keys', () => {
    expect(getLabels('EN')).toEqual(labels.en);
    expect(getLabels('Hi')).toEqual(labels.hi);
    expect(getLabels('ZH')).toEqual(labels.zh);
  });

  it('should fallback to accessible English labels for unknown languages', () => {
    expect(getLabels('unknown')).toEqual(labels.en);
    expect(getLabels('xyz')).toEqual(labels.en);
  });
});
