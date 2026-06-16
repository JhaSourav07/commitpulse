import { describe, it, expect, vi } from 'vitest';
import {
  getContributionLabel,
  getActivityInsight,
  formatTooltipDate,
  getStreakLabel,
} from './tooltipUtils';

describe('getContributionLabel – singular and plural forms', () => {
  it('uses grammatically correct language for contribution labels', () => {
    // Singular form
    expect(getContributionLabel(1)).toBe('1 contribution');

    // Plural forms
    expect(getContributionLabel(0)).toBe('0 contributions');
    expect(getContributionLabel(2)).toBe('2 contributions');
    expect(getContributionLabel(10)).toBe('10 contributions');
  });
});

describe('getActivityInsight – descriptive strings for all intensities', () => {
  it('returns non-empty, descriptive strings for each intensity level', () => {
    // Intensity level 0
    expect(getActivityInsight(0, 0)).toBe('No activity recorded');

    // Intensity level 1 (or other low values)
    expect(getActivityInsight(1, 1)).toBe('Light activity day');

    // Intensity level 2 (steady contribution)
    expect(getActivityInsight(2, 2)).toBe('Steady contribution day');

    // Intensity level 3 (high activity)
    expect(getActivityInsight(5, 3)).toBe('High activity day');

    // Intensity level 4 (peak activity)
    expect(getActivityInsight(10, 4)).toBe('Peak activity day');

    // Edge cases / boundary counts
    expect(getActivityInsight(10, 1)).toBe('Peak activity day'); // count >= 10 overrides intensity 1
    expect(getActivityInsight(5, 1)).toBe('High activity day'); // count >= 5 overrides intensity 1
    expect(getActivityInsight(2, 1)).toBe('Steady contribution day'); // count >= 2 overrides intensity 1
  });
});

describe('formatTooltipDate – human-readable date output', () => {
  it('formats valid ISO dates into reader-friendly output and handles invalid dates gracefully', () => {
    // Valid dates should become human-readable strings
    expect(formatTooltipDate('2024-01-15')).toBe('Jan 15, 2024');
    expect(formatTooltipDate('2024-12-31')).toBe('Dec 31, 2024');

    // Invalid dates should return the original input string as a fallback
    expect(formatTooltipDate('invalid-date')).toBe('invalid-date');
    expect(formatTooltipDate('')).toBe('');
  });
});

describe('getStreakLabel – structured streak descriptions', () => {
  it('returns structured, unambiguous descriptions for zero and positive streak values', () => {
    // Zero or negative active streaks
    expect(getStreakLabel(0)).toBe('No active streak');
    expect(getStreakLabel(-1)).toBe('No active streak');

    // Positive active streaks
    expect(getStreakLabel(1)).toBe('1-day active streak');
    expect(getStreakLabel(5)).toBe('5-day active streak');
  });
});

describe('getContributionLabel / getActivityInsight – t() i18n compliance', () => {
  it('respects the i18n translation function for screen readers', () => {
    // Mock translation function
    const tMock = vi.fn((key: string, options?: Record<string, string>) => {
      if (key === 'dashboard.heatmap.tooltip_single') {
        return '1 contribution on Monday';
      }
      if (key === 'dashboard.heatmap.tooltip_plural') {
        return `${options?.count} contributions on Monday`;
      }
      if (key === 'dashboard.heatmap.no_activity') {
        return 'translated no activity';
      }
      if (key === 'dashboard.heatmap.peak_activity') {
        return 'translated peak activity';
      }
      if (key === 'dashboard.heatmap.active_streak') {
        return `translated streak ${options?.streak}`;
      }
      if (key === 'dashboard.heatmap.no_active_streak') {
        return 'translated no active streak';
      }
      return 'fallback';
    });

    // Verify getContributionLabel uses translation function
    expect(getContributionLabel(1, tMock)).toBe('1 contribution');
    expect(tMock).toHaveBeenCalledWith('dashboard.heatmap.tooltip_single', expect.any(Object));

    expect(getContributionLabel(3, tMock)).toBe('3 contributions');
    expect(tMock).toHaveBeenCalledWith('dashboard.heatmap.tooltip_plural', expect.any(Object));

    // Verify getActivityInsight uses translation function
    expect(getActivityInsight(0, 0, tMock)).toBe('translated no activity');
    expect(tMock).toHaveBeenCalledWith('dashboard.heatmap.no_activity');

    expect(getActivityInsight(10, 4, tMock)).toBe('translated peak activity');
    expect(tMock).toHaveBeenCalledWith('dashboard.heatmap.peak_activity');

    // Verify getStreakLabel uses translation function
    expect(getStreakLabel(0, tMock)).toBe('translated no active streak');
    expect(tMock).toHaveBeenCalledWith('dashboard.heatmap.no_active_streak');

    expect(getStreakLabel(5, tMock)).toBe('translated streak 5');
    expect(tMock).toHaveBeenCalledWith('dashboard.heatmap.active_streak', { streak: '5' });
  });
});
