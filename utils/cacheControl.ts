interface CacheControlOptions {
  bypass?: boolean;
  secondsToMidnight?: number;
  isHistoricalYear?: boolean;
}

export function buildCacheControlHeader(options: CacheControlOptions = {}): string {
  const { bypass, secondsToMidnight, isHistoricalYear } = options || {};
  if (bypass) {
    return 'no-cache, no-store, must-revalidate';
  }

  if (isHistoricalYear) {
    return 'public, s-maxage=31536000, immutable';
  }

  if (secondsToMidnight !== undefined && secondsToMidnight !== null) {
    return `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;
  }

  return 's-maxage=3600, stale-while-revalidate=86400';
}
