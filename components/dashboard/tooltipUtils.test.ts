import { describe, expect, it } from 'vitest';
import type { ActivityData } from '@/types/dashboard';
import {
  formatTooltipDate,
  formatTooltipRange,
  getActivityInsight,
  getContributionLabel,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils', () => {
  it('formats contribution labels correctly', () => {
    expect(getContributionLabel(0)).toBe('0 contributions');
    expect(getContributionLabel(1)).toBe('1 contribution');
    expect(getContributionLabel(5)).toBe('5 contributions');
  });

  it('formats valid dates into readable tooltip dates', () => {
    expect(formatTooltipDate('2024-01-15')).toBe('Jan 15, 2024');
  });

  it('returns original value for invalid date strings', () => {
    expect(formatTooltipDate('invalid-date')).toBe('invalid-date');
  });

  it('formats a date range from a start and end date', () => {
    expect(formatTooltipRange('2024-01-01', '2024-01-07')).toBe('Jan 1, 2024 - Jan 7, 2024');
  });

  it('returns activity insights based on count and intensity', () => {
    expect(getActivityInsight(0, 0)).toBe('No activity recorded');
    expect(getActivityInsight(1, 1)).toBe('Light activity day');
    expect(getActivityInsight(3, 2)).toBe('Steady contribution day');
    expect(getActivityInsight(6, 3)).toBe('High activity day');
    expect(getActivityInsight(12, 4)).toBe('Peak activity day');
  });

  it('calculates active streak around a hovered day', () => {
    const data: ActivityData[] = [
      { date: '2024-01-01', count: 0, intensity: 0 },
      { date: '2024-01-02', count: 2, intensity: 2 },
      { date: '2024-01-03', count: 1, intensity: 1 },
      { date: '2024-01-04', count: 3, intensity: 3 },
      { date: '2024-01-05', count: 0, intensity: 0 },
    ];

    expect(getLocalActiveStreak(data, 2)).toBe(3);
    expect(getLocalActiveStreak(data, 0)).toBe(0);
  });

  it('formats streak labels correctly', () => {
    expect(getStreakLabel(0)).toBe('No active streak');
    expect(getStreakLabel(4)).toBe('4-day active streak');
  });
});
