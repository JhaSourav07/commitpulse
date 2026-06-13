import { describe, expect, it } from 'vitest';
import { deterministicRandom } from './generator';

describe('Helper Function: deterministicRandom', () => {
  it('Test 1: should return deterministic values for standard seeds', () => {
    // FNV-1a produces completely deterministic hashes based on identical strings.
    const run1 = deterministicRandom('commitpulse-seed');
    const run2 = deterministicRandom('commitpulse-seed');

    expect(run1).toBe(run2);
    expect(run1).toBeGreaterThanOrEqual(0);
    expect(run1).toBeLessThan(1);

    // Exact assertion to lock down the hash algorithm preventing future regressions.
    // If the hash algorithm changes, this will fail.
    expect(deterministicRandom('commitpulse')).toBeCloseTo(0.431545, 5);
  });

  it('Test 2: should produce distinct values for distinct seeds', () => {
    const val1 = deterministicRandom('seed:A');
    const val2 = deterministicRandom('seed:B');
    expect(val1).not.toBe(val2);
  });

  it('Test 3: should handle empty strings robustly', () => {
    const val = deterministicRandom('');
    expect(val).toBeTypeOf('number');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it('Test 4: should handle null and undefined safely falling back to an empty string', () => {
    const emptyVal = deterministicRandom('');
    const nullVal = deterministicRandom(null);
    const undefinedVal = deterministicRandom(undefined);

    expect(nullVal).toBe(emptyVal);
    expect(undefinedVal).toBe(emptyVal);
  });

  it('Test 5: should execute predictably and rapidly within standard timing expectations', () => {
    const startTime = performance.now();
    for (let i = 0; i < 10000; i++) {
      deterministicRandom(`stress-test-${i}`);
    }
    const endTime = performance.now();

    const duration = endTime - startTime;
    // 10,000 FNV-1a hashes should easily complete under 50ms on modern hardware
    expect(duration).toBeLessThan(150);
  });
});
