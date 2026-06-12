import { describe, expect, it } from 'vitest';
import { formatTooltipDate, getLocalActiveStreak, getStreakLabel } from './tooltipUtils';

describe('tooltipUtils timezone boundaries', () => {
  it('keeps UTC date stable across timezone boundaries', () => {
    expect(formatTooltipDate('2024-01-01')).toBe('Jan 1, 2024');
  });

  it('correctly formats leap year boundary dates', () => {
    expect(formatTooltipDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('correctly formats year-end boundary dates', () => {
    expect(formatTooltipDate('2024-12-31')).toBe('Dec 31, 2024');
  });

  it('preserves active streak across consecutive calendar days', () => {
    const data: {
      date: string;
      count: number;
      intensity: 1 | 2 | 3 | 4;
    }[] = [
      { date: '2024-01-01', count: 1, intensity: 1 },
      { date: '2024-01-02', count: 2, intensity: 2 },
      { date: '2024-01-03', count: 3, intensity: 3 },
    ];

    expect(getLocalActiveStreak(data, 1)).toBe(3);
  });

  it('returns correct streak label after boundary calculations', () => {
    expect(getStreakLabel(3)).toBe('3-day active streak');
  });
});
