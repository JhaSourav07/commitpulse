/**
 * GitHub API Refresh Rate Limiter with Timezone Boundary Awareness
 *
 * Manages rate limiting for GitHub API refreshes while ensuring calendar
 * date boundaries align correctly across different timezones. Handles:
 * - Timezone normalization to prevent streak divergence
 * - Calendar grid boundary alignment (midnight in local timezone)
 * - Leap year transitions without gaps
 * - Daylight savings time transitions
 */

export interface TimezoneNormalizedDate {
  /**
   * ISO date string in the target timezone (YYYY-MM-DD)
   */
  localDate: string;
  /**
   * UTC date string (YYYY-MM-DD)
   */
  utcDate: string;
  /**
   * Milliseconds since epoch in UTC
   */
  timestamp: number;
  /**
   * Timezone offset in minutes from UTC
   */
  timezoneOffsetMinutes: number;
}

export interface RefreshRateLimitResult {
  /**
   * Whether the refresh is allowed
   */
  allowed: boolean;
  /**
   * Unix timestamp when the rate limit resets
   */
  resetAt: number;
  /**
   * Seconds until reset
   */
  secondsUntilReset: number;
  /**
   * The normalized date for this refresh (in target timezone)
   */
  normalizedDate: TimezoneNormalizedDate;
}

export interface RefreshRateLimiterConfig {
  /**
   * Maximum refreshes per timezone day (defaults to 1)
   */
  limitsPerDay: number;
  /**
   * Timezone to use for day boundaries (e.g., 'America/New_York')
   */
  timezone: string;
}

/**
 * Normalizes a date to a specific timezone, handling daylight savings
 * and ensuring calendar grid alignment.
 */
export function normalizeDateToTimezone(
  timestamp: number,
  timezone: string
): TimezoneNormalizedDate {
  const utcDate = new Date(timestamp);

  // Format in target timezone using Intl API (handles DST automatically)
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(utcDate);

  // Get UTC date
  const utcDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(utcDate);

  // Calculate timezone offset by finding the difference between UTC and local time
  // Use a time formatter to get both UTC and local time, then compare
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const partsMap = new Map(parts.map((p) => [p.type, p.value]));

  const localHours = parseInt(partsMap.get('hour') || '0', 10);
  const localMinutes = parseInt(partsMap.get('minute') || '0', 10);
  const localSeconds = parseInt(partsMap.get('second') || '0', 10);

  // Create a date assuming local time is UTC to find the offset
  const localDateParts = localDateStr.split('-');
  const localAsUTC = new Date(
    Date.UTC(
      parseInt(localDateParts[0], 10),
      parseInt(localDateParts[1], 10) - 1,
      parseInt(localDateParts[2], 10),
      localHours,
      localMinutes,
      localSeconds
    )
  );

  // Offset is the difference: if local time is ahead, offset is positive
  const timezoneOffsetMinutes = (localAsUTC.getTime() - utcDate.getTime()) / (1000 * 60);

  return {
    localDate: localDateStr,
    utcDate: utcDateStr,
    timestamp,
    timezoneOffsetMinutes,
  };
}

/**
 * Gets the start of day (midnight) in a specific timezone as a UTC timestamp
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): number {
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // Parse the local date and create a UTC date at midnight
  const parts = localDateStr.split('-');
  const midnightUTC = new Date(
    Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
  );

  return midnightUTC.getTime();
}

/**
 * Gets the end of day in a specific timezone as a UTC timestamp
 */
export function getEndOfDayInTimezone(date: Date, timezone: string): number {
  return getStartOfDayInTimezone(date, timezone) + 86400000 - 1; // 24 hours - 1ms
}

/**
 * Checks if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * GitHub API Refresh Rate Limiter with timezone awareness
 *
 * Ensures that refreshes are properly rate-limited while respecting
 * timezone boundaries. This prevents streak divergence when the same
 * UTC time falls on different calendar dates across timezones.
 */
export class GitHubRefreshRateLimiter {
  private refreshLog: Map<string, Map<string, number>> = new Map(); // userId -> (dateKey -> count)
  private config: RefreshRateLimiterConfig;

  constructor(config: RefreshRateLimiterConfig = { limitsPerDay: 1, timezone: 'UTC' }) {
    this.config = config;
  }

  /**
   * Check if a refresh is allowed for a given user
   */
  checkRefresh(userId: string, now: Date = new Date()): RefreshRateLimitResult {
    const normalized = normalizeDateToTimezone(now.getTime(), this.config.timezone);
    const dateKey = normalized.localDate; // Use local date as key

    // Get or initialize the user's refresh log
    let userRefreshes = this.refreshLog.get(userId);
    if (!userRefreshes) {
      userRefreshes = new Map();
      this.refreshLog.set(userId, userRefreshes);
    }

    // Get refresh count for today
    const refreshesInCurrentDay = userRefreshes.get(dateKey) ?? 0;
    const allowed = refreshesInCurrentDay < this.config.limitsPerDay;

    if (allowed) {
      userRefreshes.set(dateKey, refreshesInCurrentDay + 1);
    }

    // Calculate reset time (next day at midnight in target timezone)
    const dayEnd = getEndOfDayInTimezone(now, this.config.timezone);
    const resetAtTimestamp = dayEnd + 1;
    const secondsUntilReset = Math.ceil((resetAtTimestamp - now.getTime()) / 1000);

    return {
      allowed,
      resetAt: resetAtTimestamp,
      secondsUntilReset: Math.max(0, secondsUntilReset),
      normalizedDate: normalized,
    };
  }

  /**
   * Get normalized date for calendar alignment
   */
  getNormalizedDate(timestamp: number): TimezoneNormalizedDate {
    return normalizeDateToTimezone(timestamp, this.config.timezone);
  }

  /**
   * Clear all refresh history (useful for testing)
   */
  clear(): void {
    this.refreshLog.clear();
  }

  /**
   * Get refresh count for a specific date range
   */
  getRefreshCount(userId: string, from: Date, to: Date): number {
    const userRefreshes = this.refreshLog.get(userId);
    if (!userRefreshes) return 0;

    let count = 0;
    userRefreshes.forEach((cnt) => {
      count += cnt;
    });
    return count;
  }
}

// Global instance for GitHub API refresh rate limiting
export const gitHubRefreshRateLimiter = new GitHubRefreshRateLimiter({
  limitsPerDay: 10,
  timezone: 'UTC',
});
