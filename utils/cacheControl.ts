interface CacheControlOptions {
  bypass?: boolean;
  secondsToMidnight?: number;
  isHistoricalYear?: boolean;
}

/**
 * Builds the Cache-Control header string based on the given cache control options.
 * Handles cache bypass, historical years caching, and midnight-aligned caching intervals.
 *
 * @param options - Cache control configuration option values
 * @returns A string value to be used in the Cache-Control HTTP header
 */
export function buildCacheControlHeader(options: CacheControlOptions = {}): string {
  const { bypass, secondsToMidnight, isHistoricalYear } = options || {};
  if (bypass) {
    return 'no-cache, no-store, must-revalidate';
  }

  if (isHistoricalYear) {
    return 'public, s-maxage=31536000, immutable';
  }

  if (secondsToMidnight !== undefined && secondsToMidnight !== null) {
    return `public, s-maxage=1, stale-while-revalidate=59`;
  }

  return 'public, s-maxage=1, stale-while-revalidate=59';
}
