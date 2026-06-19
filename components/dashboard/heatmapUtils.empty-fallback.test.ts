import { describe, expect, it } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

describe('getIntensityColor Empty Fallback Tests', () => {
  it('returns fallback color for undefined intensity', () => {
    expect(getIntensityColor(undefined as unknown as number)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns fallback color for null intensity', () => {
    expect(getIntensityColor(null as unknown as number)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns fallback color for negative intensity', () => {
    expect(getIntensityColor(-1)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns fallback color for intensity above supported range', () => {
    expect(getIntensityColor(999)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns fallback color for NaN intensity', () => {
    expect(getIntensityColor(Number.NaN)).toBe('bg-gray-200 dark:bg-[#161616]');
  });
});
