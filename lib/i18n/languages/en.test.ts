import { describe, it, expect } from 'vitest';
import { labels, getLabels } from '../badgeLabels';

describe('English language translations', () => {
  it('contains the en language key', () => {
    expect(labels).toHaveProperty('en');
  });

  it('returns the correct translation object from getLabels', () => {
    expect(getLabels('en')).toEqual(labels.en);
  });

  it('contains all required translation properties', () => {
    const en = labels.en;

    expect(en.CURRENT_STREAK).toBeTruthy();
    expect(en.ANNUAL_SYNC_TOTAL).toBeTruthy();
    expect(en.PEAK_STREAK).toBeTruthy();
    expect(en.COMMITS_THIS_MONTH).toBeTruthy();
    expect(en.VS_LAST_MONTH).toBeTruthy();
  });

  it('matches the expected English translations', () => {
    const en = labels.en;

    expect(en.CURRENT_STREAK).toBe('Current Streak');
    expect(en.ANNUAL_SYNC_TOTAL).toBe('Annual Total');
    expect(en.PEAK_STREAK).toBe('Peak Streak');
    expect(en.COMMITS_THIS_MONTH).toBe('Commits This Month');
    expect(en.VS_LAST_MONTH).toBe('vs last month');
  });

  it('falls back to English for unsupported languages', () => {
    expect(getLabels('unknown-language')).toEqual(labels.en);
  });
});
