import { DateTime } from 'luxon';

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
  const now = DateTime.utc();
  const tomorrowMidnight = now.plus({ days: 1 }).startOf('day');
  return Math.max(0, Math.floor(tomorrowMidnight.diff(now, 'seconds').seconds));
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
export function getSecondsUntilMidnightInTimezone(tz: string): number {
  const now = DateTime.now().setZone(tz);
  const tomorrowMidnight = now.plus({ days: 1 }).startOf('day');
  const seconds = Math.floor(tomorrowMidnight.diff(now, 'seconds').seconds);
  return Math.max(0, seconds);
}
