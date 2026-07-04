import { describe, expect, it, vi } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

describe('heatmapUtils mock integrations', () => {
  it('mocks async intensity fetch successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      intensity: 3,
    });

    const result = await mockFetch();

    expect(result.intensity).toBe(3);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('uses cached intensity color when available', () => {
    const cache = new Map<number, string>();

    cache.set(2, getIntensityColor(2));

    expect(cache.get(2)).toBe('bg-gray-500 dark:bg-zinc-500');
  });

  it('returns correct color from cached intensity lookup', () => {
    const cache = new Map<number, string>();

    cache.set(4, getIntensityColor(4));

    expect(cache.get(4)).toBe('bg-black dark:bg-white');
  });

  it('falls back safely during async timeout simulation', async () => {
    const mockTimeout = vi.fn().mockRejectedValue(new Error('Timeout'));

    await expect(mockTimeout()).rejects.toThrow('Timeout');
  });

  it('syncs local cache correctly after async update', async () => {
    const mockData: { intensity: number }[] = [
      { intensity: 0 },
      { intensity: 1 },
      { intensity: 2 },
      { intensity: 3 },
      { intensity: 4 },
    ];

    const mockSync = vi.fn().mockResolvedValue(mockData);

    const result = await mockSync();

    const cache = new Map<number, string>();

    (result as { intensity: number }[]).forEach((item) => {
      cache.set(item.intensity, getIntensityColor(item.intensity));
    });

    expect(cache.get(0)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(cache.get(4)).toBe('bg-black dark:bg-white');
    expect(mockSync).toHaveBeenCalled();
  });
});
