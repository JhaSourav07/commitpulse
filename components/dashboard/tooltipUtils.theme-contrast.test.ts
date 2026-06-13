import { describe, expect, it } from 'vitest';
import type { ActivityData } from '@/types/dashboard';
import {
  formatTooltipDate,
  formatTooltipRange,
  getContributionLabel,
  getActivityInsight,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils', () => {
  it('returns correct singular and plural contribution labels based on input count', () => {
    expect(getContributionLabel(0)).toBe('0 contributions');
    expect(getContributionLabel(1)).toBe('1 contribution');
    expect(getContributionLabel(42)).toBe('42 contributions');
    expect(getContributionLabel(100)).toBe('100 contributions');
  });

  it('maps correct text descriptions across all intensity thresholds', () => {
    expect(getActivityInsight(0)).toBe('No activity recorded');
    expect(getActivityInsight(1, 1)).toBe('Light activity day');
    expect(getActivityInsight(3, 2)).toBe('Steady contribution day');
    expect(getActivityInsight(6, 3)).toBe('High activity day');
    expect(getActivityInsight(12, 4)).toBe('Peak activity day');
  });

  it('falls back seamlessly to pure count evaluations if intensity tokens are missing', () => {
    expect(getActivityInsight(15)).toBe('Peak activity day');
    expect(getActivityInsight(7)).toBe('High activity day');
    expect(getActivityInsight(2)).toBe('Steady contribution day');
    expect(getActivityInsight(1)).toBe('Light activity day');
  });

  it('utilizes the provided translation callback mapping keys and interpolates options correctly', () => {
    const mockT = (key: string, options?: Record<string, string>) => {
      const map: Record<string, string> = {
        'dashboard.heatmap.no_activity': 'NO_ACTIVITY',
        'dashboard.heatmap.tooltip_plural': `${options?.count} contributions on date`,
        'dashboard.heatmap.tooltip_single': `${options?.count} contribution on date`,
        'dashboard.heatmap.active_streak': 'ACTIVE_STREAK',
        'dashboard.heatmap.no_active_streak': 'NO_STREAK',
      };
      return map[key] ?? key;
    };

    expect(getActivityInsight(0, undefined, mockT)).toBe('NO_ACTIVITY');
    expect(getContributionLabel(5, mockT)).toBe('5 contributions');
    expect(getStreakLabel(3, mockT)).toBe('ACTIVE_STREAK');
  });

  it('formats single dates consistently across month boundaries and uses fallback for invalid inputs', () => {
    expect(formatTooltipDate('2025-01-31')).toBe('Jan 31, 2025');
    expect(formatTooltipDate('2025-02-28')).toBe('Feb 28, 2025');
    expect(formatTooltipDate('2025-12-01')).toBe('Dec 1, 2025');
    expect(formatTooltipDate('2026-06-07')).toBe('Jun 7, 2026');
    expect(formatTooltipDate('not-a-date')).toBe('not-a-date');
  });

  it('formats date range labels correctly including cross-month and same-day boundaries', () => {
    expect(formatTooltipRange('2025-06-01', '2025-06-30')).toBe('Jun 1, 2025 - Jun 30, 2025');
    expect(formatTooltipRange('2025-01-31', '2025-02-01')).toBe('Jan 31, 2025 - Feb 1, 2025');
    expect(formatTooltipRange('2025-06-15', '2025-06-15')).toBe('Jun 15, 2025 - Jun 15, 2025');
    expect(formatTooltipRange('2026-06-01', '2026-06-07')).toBe('Jun 1, 2026 - Jun 7, 2026');
  });

  it('calculates consecutive active streak intervals and protects against out-of-bounds indices', () => {
    const mockDataset: ActivityData[] = [
      { date: '2026-06-01', count: 2, intensity: 1, locAdditions: 0, locDeletions: 0 },
      { date: '2026-06-02', count: 0, intensity: 0, locAdditions: 0, locDeletions: 0 },
      { date: '2026-06-03', count: 5, intensity: 3, locAdditions: 0, locDeletions: 0 },
      { date: '2026-06-04', count: 1, intensity: 1, locAdditions: 0, locDeletions: 0 },
    ];

    expect(getLocalActiveStreak(mockDataset, 2)).toBe(2);
    expect(getLocalActiveStreak(mockDataset, 1)).toBe(0);
    expect(getLocalActiveStreak(mockDataset, 999)).toBe(0);
  });

  it('returns correct streak labels for positive and non-positive values', () => {
    expect(getStreakLabel(2)).toBe('2-day active streak');
    expect(getStreakLabel(0)).toBe('No active streak');
    expect(getStreakLabel(-1)).toBe('No active streak');
  });
});
