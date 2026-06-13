/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { buildCacheControlHeader } from './cacheControl';

describe('buildCacheControlHeader - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('1. falls back to default cache control when options object is completely omitted', () => {
    // Calling the function with no arguments should fallback gracefully without throwing
    expect(buildCacheControlHeader()).toBe('s-maxage=3600, stale-while-revalidate=86400');
  });

  it('2. falls back to default cache control when options is an empty object', () => {
    expect(buildCacheControlHeader({})).toBe('s-maxage=3600, stale-while-revalidate=86400');
  });

  it('3. falls back to default cache control when options object is null', () => {
    // Casting to any to test JavaScript-level null input resilience
    expect(buildCacheControlHeader(null as any)).toBe(
      's-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('4. falls back to default cache control when options contain only undefined or null values', () => {
    expect(
      buildCacheControlHeader({
        bypass: undefined,
        secondsToMidnight: undefined,
        isHistoricalYear: undefined,
      })
    ).toBe('s-maxage=3600, stale-while-revalidate=86400');

    expect(
      buildCacheControlHeader({
        bypass: null as any,
        secondsToMidnight: null as any,
        isHistoricalYear: null as any,
      })
    ).toBe('s-maxage=3600, stale-while-revalidate=86400');
  });

  it('5. prioritizes bypass=true even if other options are invalid/null/undefined', () => {
    expect(
      buildCacheControlHeader({
        bypass: true,
        secondsToMidnight: null as any,
        isHistoricalYear: undefined,
      })
    ).toBe('no-cache, no-store, must-revalidate');
  });

  it('6. prioritizes isHistoricalYear=true when bypass is falsy and secondsToMidnight is null/undefined', () => {
    expect(
      buildCacheControlHeader({
        bypass: false,
        secondsToMidnight: undefined,
        isHistoricalYear: true,
      })
    ).toBe('public, s-maxage=31536000, immutable');
  });
});
