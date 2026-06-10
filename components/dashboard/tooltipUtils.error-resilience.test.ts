import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ActivityData } from '@/types/dashboard';

import {
  formatTooltipDate,
  getActivityInsight,
  getContributionLabel,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('gracefully returns the original string for malformed dates', () => {
    const corruptedDate = 'corrupted-timestamp-2026';

    expect(formatTooltipDate(corruptedDate)).toBe(corruptedDate);
  });

  it('handles unusual contribution counts without throwing errors', () => {
    expect(() => {
      getContributionLabel(Number.NEGATIVE_INFINITY);
      getContributionLabel(0);
      getContributionLabel(-1);
    }).not.toThrow();

    expect(getContributionLabel(Number.NEGATIVE_INFINITY)).toBe('-Infinity contributions');

    expect(getContributionLabel(0)).toBe('0 contributions');
  });

  it('returns a stable fallback insight for unexpected activity values', () => {
    const insight = getActivityInsight(-999, -999 as ActivityData['intensity']);

    expect(insight).toBeDefined();
    expect(typeof insight).toBe('string');
    expect(insight).toBe('Light activity day');
  });

  it('returns zero streak for empty datasets and out-of-range indexes', () => {
    const emptyDataset: ActivityData[] = [];

    expect(() => {
      expect(getLocalActiveStreak(emptyDataset, 0)).toBe(0);
      expect(getLocalActiveStreak(emptyDataset, 10)).toBe(0);
      expect(getLocalActiveStreak(emptyDataset, -1)).toBe(0);
    }).not.toThrow();
  });

  it('returns a safe fallback label for invalid or non-positive streak values', () => {
    expect(getStreakLabel(0)).toBe('No active streak');
    expect(getStreakLabel(-5)).toBe('No active streak');
    expect(getStreakLabel(-100)).toBe('No active streak');
  });
});
