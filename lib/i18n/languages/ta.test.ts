import { describe, it, expect } from 'vitest';
import { labels, getLabels } from '../badgeLabels';

describe('Tamil language translations', () => {
  it('contains the ta language key', () => {
    expect(labels).toHaveProperty('ta');
  });

  it('returns the correct translation object from getLabels', () => {
    expect(getLabels('ta')).toEqual(labels.ta);
  });

  it('contains all required translation properties', () => {
    const ta = labels.ta;

    expect(ta.CURRENT_STREAK).toBeTruthy();
    expect(ta.ANNUAL_SYNC_TOTAL).toBeTruthy();
    expect(ta.PEAK_STREAK).toBeTruthy();
    expect(ta.COMMITS_THIS_MONTH).toBeTruthy();
    expect(ta.VS_LAST_MONTH).toBeTruthy();
  });

  it('matches the expected Tamil translations', () => {
    const ta = labels.ta;

    expect(ta.CURRENT_STREAK).toBe('தற்போதைய_தொடர்');
    expect(ta.ANNUAL_SYNC_TOTAL).toBe('ஆண்டு_மொத்தம்');
    expect(ta.PEAK_STREAK).toBe('உச்ச_தொடர்');
    expect(ta.COMMITS_THIS_MONTH).toBe('இம்மாத கமிட்கள்');
    expect(ta.VS_LAST_MONTH).toBe('கடந்த மாதத்துடன்');
  });
});