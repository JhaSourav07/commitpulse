import { describe, it, expect } from 'vitest';
import { buildCacheControlHeader } from './cacheControl';

describe('buildCacheControlHeader', () => {
  it('returns no-cache when bypass is true', () => {
    expect(buildCacheControlHeader({ bypass: true })).toBe('no-cache, no-store, must-revalidate');
  });

  it('returns immutable when isHistoricalYear is true', () => {
    expect(buildCacheControlHeader({ isHistoricalYear: true })).toBe(
      'public, s-maxage=31536000, immutable'
    );
  });

  it('returns s-maxage with secondsToMidnight', () => {
    expect(buildCacheControlHeader({ secondsToMidnight: 3600 })).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
  });

  it('returns default s-maxage when no options given', () => {
    expect(buildCacheControlHeader({})).toBe('s-maxage=3600, stale-while-revalidate=86400');
  });
});
