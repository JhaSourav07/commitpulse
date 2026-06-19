import { describe, expect, it } from 'vitest';
import { particleCount } from './generator';

describe('Helper Function: particleCount', () => {
  it('Test 1: should return exactly 0 when count is 0', () => {
    expect(particleCount(0)).toBe(0);
  });

  it('Test 2: should scale linearly and strictly clamp minimum output to 3', () => {
    // 1 / 4 = 0.25 (floor -> 0), clamped to min 3
    expect(particleCount(1)).toBe(3);
    // 11 / 4 = 2.75 (floor -> 2), clamped to min 3
    expect(particleCount(11)).toBe(3);
    // 12 / 4 = 3 (floor -> 3), exact minimum boundary
    expect(particleCount(12)).toBe(3);
  });

  it('Test 3: should scale linearly and properly output mid-range calculations', () => {
    // 16 / 4 = 4 (floor -> 4), between min 3 and max 5
    expect(particleCount(16)).toBe(4);
    // 19 / 4 = 4.75 (floor -> 4)
    expect(particleCount(19)).toBe(4);
  });

  it('Test 4: should scale linearly and strictly clamp maximum output to 5', () => {
    // 20 / 4 = 5 (floor -> 5), exact max boundary
    expect(particleCount(20)).toBe(5);
    // 1000 / 4 = 250, tightly clamped to max 5 to prevent SVG bloat
    expect(particleCount(1000)).toBe(5);
  });

  it('Test 5: should assert robust fallback to 0 for null, undefined, negatives, and NaN', () => {
    expect(particleCount(undefined)).toBe(0);
    expect(particleCount(null)).toBe(0);
    expect(particleCount(-10)).toBe(0);
    expect(particleCount(NaN)).toBe(0);

    // Edge case assertions for JavaScript runtime type leakage
    // @ts-expect-error forcing string injection
    expect(particleCount('50')).toBe(0);
  });

  it('Test 6: should execute predictably and rapidly within standard timing expectations', () => {
    const startTime = performance.now();
    for (let i = 0; i < 10000; i++) {
      particleCount(i);
    }
    const endTime = performance.now();

    const duration = endTime - startTime;
    // 10,000 simple mathematical calculations should easily complete under 50ms
    expect(duration).toBeLessThan(50);
  });
});
