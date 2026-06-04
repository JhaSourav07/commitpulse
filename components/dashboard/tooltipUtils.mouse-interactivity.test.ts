import { describe, it, expect } from 'vitest';
import {
  formatTooltipDate,
  getContributionLabel,
  getActivityInsight,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';
import type { ActivityData } from '@/types/dashboard';

describe('Tooltip Utility Functions', () => {
  // Test Case 1: Date Formatting
  it('1. should accurately parse and format valid date strings', () => {
    // Note: Due to UTC timezone enforcement in your function,
    // we expect standard formatting without local timezone shifts.
    expect(formatTooltipDate('2023-10-15')).toBe('Oct 15, 2023');

    // Should fallback to the original string if parsing fails
    expect(formatTooltipDate('invalid-date-format')).toBe('invalid-date-format');
  });

  // Test Case 2: Contribution Labels
  it('2. should correctly pluralize contribution labels based on count', () => {
    expect(getContributionLabel(0)).toBe('0 contributions');
    expect(getContributionLabel(1)).toBe('1 contribution'); // Singular
    expect(getContributionLabel(42)).toBe('42 contributions');
  });

  // Test Case 3: Activity Insights
  it('3. should return the correct activity insight based on count and intensity thresholds', () => {
    expect(getActivityInsight(0)).toBe('No activity recorded');
    expect(getActivityInsight(12)).toBe('Peak activity day'); // count >= 10
    expect(getActivityInsight(2, 4)).toBe('Peak activity day'); // intensity === 4
    expect(getActivityInsight(6)).toBe('High activity day'); // count >= 5
    expect(getActivityInsight(3)).toBe('Steady contribution day'); // count >= 2
    expect(getActivityInsight(1)).toBe('Light activity day'); // fallback
  });

  // Test Case 4: Streak Calculation
  it('4. should correctly calculate continuous local active streaks forwards and backwards', () => {
    // Mock dataset representing a 3-day streak flanked by 0-count days
    const mockData = [
      { count: 0 },
      { count: 2 }, // Index 1
      { count: 5 }, // Index 2 (Target)
      { count: 1 }, // Index 3
      { count: 0 },
    ] as ActivityData[];

    // If the target day has 0 count, streak is 0
    expect(getLocalActiveStreak(mockData, 0)).toBe(0);

    // If target is inside the streak, it should count the total contiguous block (indices 1, 2, 3)
    expect(getLocalActiveStreak(mockData, 2)).toBe(3);

    // Edge case: out of bounds index
    expect(getLocalActiveStreak(mockData, 99)).toBe(0);
  });

  // Test Case 5: Streak Formatting
  it('5. should format streak labels correctly and handle zero/negative states', () => {
    expect(getStreakLabel(0)).toBe('No active streak');
    expect(getStreakLabel(-5)).toBe('No active streak');
    expect(getStreakLabel(7)).toBe('7-day active streak');
  });
});
