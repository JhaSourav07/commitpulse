import { describe, expect, it } from 'vitest';
import { SVG_WIDTH, SVG_HEIGHT, isFontKey } from './generatorConstants';
import { FONT_MAP } from './fonts';

describe('generatorConstants Massive Scaling', () => {
  it('isFontKey returns true for all known keys across 10,000 lookups', () => {
    const keys = Object.keys(FONT_MAP);
    expect(keys.length).toBeGreaterThan(0);

    let allValid = true;
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      const key = keys[i % keys.length];
      if (!isFontKey(key)) {
        allValid = false;
        break;
      }
    }
    const duration = performance.now() - start;

    expect(allValid).toBe(true);
    // Generous performance margin to prevent CI flakiness
    expect(duration).toBeLessThan(5000);
  });

  it('isFontKey returns false for 5,000 synthetic unknown font names', () => {
    const knownKeys = new Set(Object.keys(FONT_MAP));
    for (let i = 0; i < 5_000; i++) {
      const candidate = `nonexistent_font_sentinel_${i}`;
      if (!knownKeys.has(candidate)) {
        expect(isFontKey(candidate)).toBe(false);
      }
    }
  });

  it('SVG_WIDTH and SVG_HEIGHT do not drift under 10,000 repeated reads', () => {
    let widthSum = 0;
    let heightSum = 0;
    for (let i = 0; i < 10_000; i++) {
      widthSum += SVG_WIDTH;
      heightSum += SVG_HEIGHT;
    }
    expect(widthSum).toBe(600 * 10_000);
    expect(heightSum).toBe(420 * 10_000);
  });

  it('SVG_WIDTH and SVG_HEIGHT yield valid coordinate bounds for 10,000 simulated contributor positions', () => {
    let allValid = true;
    for (let i = 0; i < 10_000; i++) {
      const x = i % SVG_WIDTH;
      const y = Math.floor(i / SVG_WIDTH) % SVG_HEIGHT;
      if (
        x < 0 ||
        x >= SVG_WIDTH ||
        y < 0 ||
        y >= SVG_HEIGHT ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        allValid = false;
        break;
      }
    }
    expect(allValid).toBe(true);
  });

  it('isFontKey handles extreme string lengths without timing out', () => {
    const knownKeys = new Set(Object.keys(FONT_MAP));
    const extremeInputs = [
      '',
      'a',
      'x'.repeat(100),
      'x'.repeat(10_000),
      'x'.repeat(100_000),
    ].filter((s) => !knownKeys.has(s));

    const start = performance.now();
    extremeInputs.forEach((s) => {
      expect(isFontKey(s)).toBe(false);
    });
    const duration = performance.now() - start;
    // Generous performance margin to prevent CI flakiness
    expect(duration).toBeLessThan(5000);
  });
});
