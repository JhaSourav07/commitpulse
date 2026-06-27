import { describe, it, expect } from 'vitest';
import type { ActivityData } from '@/types/dashboard';
import {
  getLocalActiveStreak,
  getContributionLabel,
  getActivityInsight,
  formatTooltipDate,
  formatTooltipRange,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils massive scaling behavior', () => {
  it('handles 10,000 consecutive active entries', () => {
    const data: ActivityData[] = Array.from({ length: 10000 }, (_, i) => ({
      date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
      count: i + 1,
      intensity: 4,
    }));

    expect(getLocalActiveStreak(data, 5000)).toBe(10000);
  });

  it('maintains correctness with large mixed datasets', () => {
    const data: ActivityData[] = Array.from({ length: 5000 }, (_, i) => ({
      date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
      count: i % 3 === 0 ? 0 : i + 1,
      intensity: (i % 5) as ActivityData['intensity'],
    }));

    const results = [500, 1500, 3000, 4500].map((index) => getLocalActiveStreak(data, index));

    expect(results).toHaveLength(4);
    expect(results.every((r) => Number.isInteger(r))).toBe(true);
    expect(results.every((r) => r >= 0)).toBe(true);
  });

  it('handles contribution counts in the millions', () => {
    expect(getContributionLabel(1_000_000)).toBe('1000000 contributions');
    expect(getContributionLabel(5_000_000)).toBe('5000000 contributions');
    expect(getContributionLabel(999_999_999)).toBe('999999999 contributions');
    expect(getContributionLabel(1)).toBe('1 contribution');
  });

  it('returns correct activity insight for extreme values', () => {
    expect(getActivityInsight(0, 0)).toBe('No activity recorded');
    expect(getActivityInsight(10_000_000, 4)).toBe('Peak activity day');
    expect(getActivityInsight(6, 3)).toBe('High activity day');
    expect(getActivityInsight(3, 2)).toBe('Steady contribution day');
    expect(getActivityInsight(1, 0)).toBe('Light activity day');
  });

  it('remains performant and stable under repeated invocations', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      formatTooltipDate('2024-06-15');
      formatTooltipRange('2024-01-01', '2024-12-31');
      getStreakLabel(365);
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);

    expect(formatTooltipDate('2024-06-15')).toBe(formatTooltipDate('2024-06-15'));

    expect(formatTooltipRange('2024-01-01', '2024-12-31')).toBe(
      formatTooltipRange('2024-01-01', '2024-12-31')
    );

    expect(getStreakLabel(365)).toBe(getStreakLabel(365));
  });
});
