import { describe, expect, it } from 'vitest';
import { formatTooltipDate, getLocalActiveStreak, getStreakLabel } from './tooltipUtils';

describe('timezone normalization and calendar boundaries', () => {
  it('formats UTC boundary date consistently', () => {
    expect(formatTooltipDate('2024-01-01')).toBe('Jan 1, 2024');
  });

  it('formats leap year date correctly', () => {
    expect(formatTooltipDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('formats year-end boundary correctly', () => {
    expect(formatTooltipDate('2024-12-31')).toBe('Dec 31, 2024');
  });

  it('calculates streak across consecutive calendar days', () => {
    const data = [
      { date: '2024-01-01', count: 1, intensity: 1 as const },
      { date: '2024-01-02', count: 1, intensity: 1 as const },
      { date: '2024-01-03', count: 1, intensity: 1 as const },
    ];

    expect(getLocalActiveStreak(data, 1)).toBe(3);
  });

  it('returns correct streak label', () => {
    expect(getStreakLabel(3)).toBe('3-day active streak');
  });
});
