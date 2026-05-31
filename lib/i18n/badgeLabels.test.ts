import { describe, it, expect } from 'vitest';
import { labels } from './badgeLabels';

describe('i18n badgeLabels', () => {
  describe('all locales have COMMITS_THIS_MONTH and VS_LAST_MONTH keys', () => {
    Object.entries(labels).forEach(([locale, translation]) => {
      it(`locale "${locale}" has a non-empty COMMITS_THIS_MONTH`, () => {
        expect(typeof translation.COMMITS_THIS_MONTH).toBe('string');
        expect(translation.COMMITS_THIS_MONTH.length).toBeGreaterThan(0);
      });

      it(`locale "${locale}" has a non-empty VS_LAST_MONTH`, () => {
        expect(typeof translation.VS_LAST_MONTH).toBe('string');
        expect(translation.VS_LAST_MONTH.length).toBeGreaterThan(0);
      });
    });
  });
});
