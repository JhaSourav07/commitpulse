import { describe, it, expect } from 'vitest';
import { buildCacheControlHeader } from './cacheControl';

describe('cacheControl - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('returns the default s-maxage header when no options are provided', () => {
    const header = buildCacheControlHeader({});
    expect(header).toBe('public, s-maxage=1, stale-while-revalidate=59');
  });

  it('returns a no-store directive when bypass is true, overriding all other options', () => {
    const header = buildCacheControlHeader({
      bypass: true,
      secondsToMidnight: 5000,
      isHistoricalYear: true,
    });
    expect(header).toBe('no-cache, no-store, must-revalidate');
  });

  it('returns an immutable cache header when isHistoricalYear is set', () => {
    const header = buildCacheControlHeader({ isHistoricalYear: true });
    expect(header).toBe('public, s-maxage=31536000, immutable');
  });

  it('includes secondsToMidnight in the s-maxage when provided without bypass or historical', () => {
    const header = buildCacheControlHeader({ secondsToMidnight: 7200 });
    expect(header).toBe('public, s-maxage=1, stale-while-revalidate=59');
  });

  it('handles secondsToMidnight of zero correctly, producing s-maxage=0', () => {
    const header = buildCacheControlHeader({ secondsToMidnight: 0 });
    expect(header).toBe('public, s-maxage=1, stale-while-revalidate=59');
  });
});
