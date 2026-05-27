import { describe, it, expect } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

describe('getIntensityColor', () => {
  it('returns correct color for intensity 0', () => {
    expect(getIntensityColor(0)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns correct color for intensity 1', () => {
    expect(getIntensityColor(1)).toBe('bg-gray-400 dark:bg-zinc-700');
  });

  it('returns correct color for intensity 2', () => {
    expect(getIntensityColor(2)).toBe('bg-gray-500 dark:bg-zinc-500');
  });

  it('returns correct color for intensity 3', () => {
    expect(getIntensityColor(3)).toBe('bg-gray-700 dark:bg-zinc-300');
  });

  it('returns correct color for intensity 4', () => {
    expect(getIntensityColor(4)).toBe('bg-black dark:bg-white');
  });

  it('returns default color for out-of-range intensity', () => {
    expect(getIntensityColor(999)).toBe('bg-gray-200 dark:bg-[#161616]');
  });
});
