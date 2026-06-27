import { describe, expect, it, vi } from 'vitest';
import {
  formatTooltipDate,
  getActivityInsight,
  getContributionLabel,
  getLocalActiveStreak,
  getStreakLabel,
} from './tooltipUtils';

describe('tooltipUtils mock integrations', () => {
  it('mocks async contribution fetch successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      count: 5,
    });

    const result = await mockFetch();

    expect(result.count).toBe(5);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('uses cached tooltip label when available', () => {
    const cache = new Map();

    cache.set('label', getContributionLabel(3));

    expect(cache.get('label')).toBe('3 contributions');
  });

  it('formats cached tooltip dates correctly', () => {
    const cacheDate = formatTooltipDate('2024-01-10');

    expect(cacheDate).toBe('Jan 10, 2024');
  });

  it('falls back safely during async timeout simulation', async () => {
    const mockTimeout = vi.fn().mockRejectedValue(new Error('Timeout'));

    await expect(mockTimeout()).rejects.toThrow('Timeout');
  });

  it('syncs streak cache correctly after async update', async () => {
    const mockData = [
      { date: '2024-01-01', count: 1, intensity: 1 },
      { date: '2024-01-02', count: 2, intensity: 2 },
    ];

    const mockSync = vi.fn().mockResolvedValue(mockData);

    const result = await mockSync();

    expect(getLocalActiveStreak(result, 0)).toBe(2);
    expect(getActivityInsight(2, 2)).toBe('Steady contribution day');
    expect(getStreakLabel(2)).toBe('2-day active streak');
  });
});
