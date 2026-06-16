// utils/time.ts

/**
 * Calculates the number of seconds remaining until the next UTC midnight.
 *
 * @returns Number of seconds until the upcoming UTC midnight
 *
 * @example
 * const seconds = getSecondsUntilUTCMidnight();
 * console.log(seconds); // e.g., 3600
 */

export function getSecondsUntilUTCMidnight(): number {
  const now = new Date();

  // Create a Date object for the upcoming midnight in UTC
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );

  // Return the difference in seconds
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

/**
 * Calculates the number of seconds remaining until midnight in a given timezone.
 *
 * @param tz - IANA timezone string (e.g., "America/New_York", "Asia/Kolkata")
 * @returns Number of seconds until the next midnight in the specified timezone
 *
 * @remarks
 * ⚠️ On Daylight Saving Time (DST) transition days (spring-forward/fall-back),
 * the day length may be 23 or 25 hours. As a result, the returned value can be
 * off by up to one hour. This is acceptable for use cases like cache TTL.
 *
 * @example
 * const seconds = getSecondsUntilMidnightInTimezone("Asia/Kolkata");
 * console.log(seconds);
 */
export function getSecondsUntilMidnightInTimezone(tz?: string | null): number {
  if (tz === undefined || tz === null || tz.trim() === '') {
    return getSecondsUntilUTCMidnight();
  }

  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  // hour24 can return 24 at midnight in some Intl implementations; normalise with % 24
  const hour = get('hour') % 24;
  const minute = get('minute');
  const second = get('second');

  return 86400 - (hour * 3600 + minute * 60 + second);
}
