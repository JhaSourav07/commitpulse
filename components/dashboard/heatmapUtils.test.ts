import { describe, expect, it } from 'vitest';

import { getIntensityColor } from './heatmapUtils';

describe('getIntensityColor', () => {
  it('returns the default gray class for intensity 0', () => {
    expect(getIntensityColor(0)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns the correct class for intensity 1', () => {
    expect(getIntensityColor(1)).toBe('bg-gray-400 dark:bg-zinc-700');
  });

  it('returns the correct class for intensity 2', () => {
    expect(getIntensityColor(2)).toBe('bg-gray-500 dark:bg-zinc-500');
  });

  it('returns the correct class for intensity 3', () => {
    expect(getIntensityColor(3)).toBe('bg-gray-700 dark:bg-zinc-300');
  });

  it('returns the correct class for intensity 4', () => {
    expect(getIntensityColor(4)).toBe('bg-black dark:bg-white');
  });

  it('returns the default fallback class for intensity 99', () => {
    expect(getIntensityColor(99)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns the default fallback class for intensity -1', () => {
    expect(getIntensityColor(-1)).toBe('bg-gray-200 dark:bg-[#161616]');
  });
});
