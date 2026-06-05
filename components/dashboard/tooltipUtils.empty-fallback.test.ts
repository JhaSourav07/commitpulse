import { describe, expect, it } from 'vitest';
import {
  formatTooltipDate,
  getActivityInsight,
  getContributionLabel,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils empty fallback behavior', () => {
  it('returns original value for empty or invalid tooltip dates', () => {
    expect(formatTooltipDate('')).toBe('');
    expect(formatTooltipDate('invalid-date')).toBe('invalid-date');
  });

  it('formats zero contributions with plural fallback label', () => {
    expect(getContributionLabel(0)).toBe('0 contributions');
  });

  it('returns no activity insight for zero count without intensity', () => {
    expect(getActivityInsight(0)).toBe('No activity recorded');
  });

  it('returns zero local active streak for empty activity data', () => {
    expect(getLocalActiveStreak([], 0)).toBe(0);
  });

  it('returns no active streak label for zero or negative streaks', () => {
    expect(getStreakLabel(0)).toBe('No active streak');
    expect(getStreakLabel(-1)).toBe('No active streak');
  });
});
