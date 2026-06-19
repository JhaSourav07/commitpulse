import { describe, expect, it } from 'vitest';
import { buildCacheControlHeader } from './cacheControl';

describe('buildCacheControlHeader - Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('1. handles extreme high bound values for secondsToMidnight without formatting corruption', () => {
    // Testing with maximum safe integer and an arbitrarily large number
    const maxSafe = Number.MAX_SAFE_INTEGER;
    const extremeBound = 999999999999999;

    expect(buildCacheControlHeader({ secondsToMidnight: maxSafe })).toBe(
      `public, s-maxage=${maxSafe}, stale-while-revalidate=86400`
    );
    expect(buildCacheControlHeader({ secondsToMidnight: extremeBound })).toBe(
      `public, s-maxage=${extremeBound}, stale-while-revalidate=86400`
    );
  });

  it('2. processes negative numerical bounds for secondsToMidnight correctly', () => {
    // Checking negative values to ensure string interpolation holds correctly
    expect(buildCacheControlHeader({ secondsToMidnight: -1 })).toBe(
      'public, s-maxage=-1, stale-while-revalidate=86400'
    );
    expect(buildCacheControlHeader({ secondsToMidnight: -86400 })).toBe(
      'public, s-maxage=-86400, stale-while-revalidate=86400'
    );
  });

  it('3. handles exact zero bounds properly instead of falling back to default', () => {
    // 0 is falsy, so we ensure the function distinguishes \`0\` from \`undefined\`
    expect(buildCacheControlHeader({ secondsToMidnight: 0 })).toBe(
      'public, s-maxage=0, stale-while-revalidate=86400'
    );
  });

  it('4. processes JavaScript numeric edge cases like Infinity and NaN without crashing', () => {
    // Even if NaN/Infinity aren't standard cache values, the backend utility
    // shouldn't crash when massive calculations yield floating point edge cases.
    expect(buildCacheControlHeader({ secondsToMidnight: Infinity })).toBe(
      'public, s-maxage=Infinity, stale-while-revalidate=86400'
    );
    expect(buildCacheControlHeader({ secondsToMidnight: NaN })).toBe(
      'public, s-maxage=NaN, stale-while-revalidate=86400'
    );
  });

  it('5. executes massive scale iterations within strict performance margins', () => {
    // Emulate a high-volume caching scenario where thousands of requests are processed
    const iterations = 100000;

    const startCalc = performance.now();
    for (let i = 0; i < iterations; i++) {
      // Rotate through different variations to prevent V8 from optimizing away a single pure call
      buildCacheControlHeader({ secondsToMidnight: i });
      buildCacheControlHeader({ bypass: i % 2 === 0 });
      buildCacheControlHeader({ isHistoricalYear: i % 3 === 0 });
    }
    const endCalc = performance.now();
    const elapsedCalc = endCalc - startCalc;

    // Direct performance calculation should be incredibly fast
    // We allow a generous 500ms limit, though it usually takes <50ms
    const calcLimit = process.env.CI ? 2000 : 500;
    expect(elapsedCalc).toBeLessThan(calcLimit);
  });
});
