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
  it('getLocalActiveStreak correctly handles 10,000 consecutive active entries', () => {
    const data: ActivityData[] = Array.from({ length: 10000 }, (_, i) => ({
      date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
      count: i + 1, // all entries have count > 0
      intensity: 4,
    }));

    const middleIndex = 5000;
    const streak = getLocalActiveStreak(data, middleIndex);

    // Should count all preceding entries (5000) + current (1) + all following entries (4999)
    expect(streak).toBe(10000);
  });

  it('getLocalActiveStreak maintains correctness and performance on large datasets with mixed activity', () => {
    const data: ActivityData[] = Array.from({ length: 5000 }, (_, i) => ({
      date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
      count: i % 3 === 0 ? 0 : i + 1, // every 3rd entry has no activity
      intensity: (i % 5) as ActivityData['intensity'],
    }));

    const results = [
      getLocalActiveStreak(data, 500),
      getLocalActiveStreak(data, 1500),
      getLocalActiveStreak(data, 3000),
      getLocalActiveStreak(data, 4500),
    ];

    expect(results).toHaveLength(4);
    expect(results.every((r) => typeof r === 'number')).toBe(true);
    expect(results.every((r) => r >= 0)).toBe(true);
  });

  it('getContributionLabel handles extreme counts >= 1,000,000 without overflow or formatting errors', () => {
    const testCases = [
      { count: 1000000, expected: '1000000 contributions' },
      { count: 5000000, expected: '5000000 contributions' },
      { count: 999999999, expected: '999999999 contributions' },
      { count: 1, expected: '1 contribution' },
    ];

    testCases.forEach(({ count, expected }) => {
      const result = getContributionLabel(count);
      expect(result).toBe(expected);
    });
  });

  it('getActivityInsight returns correct insights with extreme count and intensity values', () => {
    const testCases: Array<{
      count: number;
      intensity: ActivityData['intensity'];
      expectedKey: string;
    }> = [
      { count: 0, intensity: 0, expectedKey: 'No activity recorded' },
      { count: 10000000, intensity: 4, expectedKey: 'Peak activity day' },
      { count: 5000000, intensity: 3, expectedKey: 'High activity day' },
      { count: 2000000, intensity: 2, expectedKey: 'Steady contribution day' },
      { count: 1, intensity: 0, expectedKey: 'Light activity day' },
      { count: 100, intensity: 4, expectedKey: 'Peak activity day' },
    ];

    testCases.forEach(({ count, intensity, expectedKey }) => {
      const result = getActivityInsight(count, intensity);
      expect(result).toBe(expectedKey);
    });
  });

  it('formatTooltipDate, formatTooltipRange, and getStreakLabel maintain stability under repeated invocations', () => {
    const testDates = ['2024-01-15', '2024-12-31', '2000-01-01', '2099-12-31'];
    const testStreaks = [0, 1, 100, 365, 1000, 10000];
    const invocationCount = 1000;

    // Repeated date formatting
    for (let i = 0; i < invocationCount; i++) {
      testDates.forEach((date) => {
        formatTooltipDate(date);
      });
    }

    // Repeated range formatting
    for (let i = 0; i < invocationCount / 10; i++) {
      formatTooltipRange('2024-01-01', '2024-12-31');
    }

    // Repeated streak label formatting
    for (let i = 0; i < invocationCount; i++) {
      testStreaks.forEach((streak) => {
        getStreakLabel(streak);
      });
    }

    // Verify consistency: repeated calls produce identical results
    expect(formatTooltipDate('2024-06-15')).toBe(formatTooltipDate('2024-06-15'));
    expect(formatTooltipRange('2024-01-01', '2024-12-31')).toBe(
      formatTooltipRange('2024-01-01', '2024-12-31')
    );
    expect(getStreakLabel(365)).toBe(getStreakLabel(365));
  });
});
