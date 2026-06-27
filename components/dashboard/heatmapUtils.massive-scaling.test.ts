import { describe, expect, it } from 'vitest';
import { getIntensityColor } from './heatmapUtils';

describe('heatmapUtils Massive Scaling Tests', () => {
  it('1. handles extreme high positive intensity values without crashing', () => {
    expect(getIntensityColor(Number.MAX_SAFE_INTEGER)).toBe('bg-gray-200 dark:bg-[#161616]');

    expect(getIntensityColor(999999999)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('2. handles negative intensity values safely', () => {
    expect(getIntensityColor(-1)).toBe('bg-gray-200 dark:bg-[#161616]');

    expect(getIntensityColor(-999999)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('3. handles numeric edge cases such as Infinity and NaN', () => {
    expect(getIntensityColor(Infinity)).toBe('bg-gray-200 dark:bg-[#161616]');

    expect(getIntensityColor(NaN)).toBe('bg-gray-200 dark:bg-[#161616]');
  });

  it('4. correctly resolves colors for massive datasets of valid intensities', () => {
    const intensities = Array.from({ length: 100000 }, (_, i) => i % 5);

    const results = intensities.map(getIntensityColor);

    expect(results).toHaveLength(100000);
    expect(results[0]).toBe('bg-gray-200 dark:bg-[#161616]');
    expect(results[4]).toBe('bg-black dark:bg-white');
  });

  it('5. executes high-volume intensity calculations within performance limits', () => {
    const start = performance.now();

    for (let i = 0; i < 100000; i++) {
      getIntensityColor(i % 5);
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(process.env.CI ? 10000 : 3000);
  });
});
