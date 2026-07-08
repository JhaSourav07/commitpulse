import { describe, expect, it } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

describe('heatmapUtils - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  it('returns the safe default fallback class for negative intensity values without throwing', () => {
    // Negative values must never crash — they must hit the default branch
    expect(() => getIntensityColor(-1)).not.toThrow();
    expect(() => getIntensityColor(-100)).not.toThrow();

    expect(getIntensityColor(-1)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(-100)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns the safe default fallback class for out-of-range high intensity values without throwing', () => {
    // Values above 4 must fall through to the default branch — not crash or return undefined
    expect(() => getIntensityColor(5)).not.toThrow();
    expect(() => getIntensityColor(999)).not.toThrow();
    expect(() => getIntensityColor(Number.MAX_SAFE_INTEGER)).not.toThrow();

    expect(getIntensityColor(5)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(999)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(Number.MAX_SAFE_INTEGER)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns the safe default fallback class for NaN and Infinity without throwing', () => {
    // NaN and Infinity are numeric edge cases that must be absorbed by the default branch
    expect(() => getIntensityColor(NaN)).not.toThrow();
    expect(() => getIntensityColor(Infinity)).not.toThrow();
    expect(() => getIntensityColor(-Infinity)).not.toThrow();

    expect(getIntensityColor(NaN)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(Infinity)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(-Infinity)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns the safe default fallback class for non-integer float values without throwing', () => {
    // Float values like 1.5 or 3.9 do not match any case branch — default must absorb them
    expect(() => getIntensityColor(1.5)).not.toThrow();
    expect(() => getIntensityColor(3.9)).not.toThrow();
    expect(() => getIntensityColor(0.1)).not.toThrow();

    expect(getIntensityColor(1.5)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(3.9)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(0.1)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('returns the correct class for all valid intensity levels 0–4 confirming no regression on the happy path', () => {
    // Verifying all 5 valid branches return distinct non-empty strings and never fall to the default
    expect(getIntensityColor(0)).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(getIntensityColor(1)).toBe('bg-gray-400 dark:bg-zinc-700');
    expect(getIntensityColor(2)).toBe('bg-gray-500 dark:bg-zinc-500');
    expect(getIntensityColor(3)).toBe('bg-gray-700 dark:bg-zinc-300');
    expect(getIntensityColor(4)).toBe('bg-black dark:bg-white');

    // All 5 must be distinct strings — no two valid levels should collapse to the same class
    const results = [0, 1, 2, 3, 4].map(getIntensityColor);
    const unique = new Set(results);
    expect(unique.size).toBe(5);
  });
});
