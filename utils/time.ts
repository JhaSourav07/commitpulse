import { DateTime } from 'luxon';

export function getSecondsUntilUTCMidnight(): number {
  const now = DateTime.utc();
  const tomorrowMidnight = now.plus({ days: 1 }).startOf('day');
  return Math.max(0, Math.floor(tomorrowMidnight.diff(now, 'seconds').seconds));
}

// Returns seconds until midnight in the given IANA timezone (e.g. 'America/New_York').
// Used to set CDN cache TTLs that reset at the user's local midnight rather than UTC midnight.
// Luxon fully respects historical DST rules and transitions (23h or 25h days).
export function getSecondsUntilMidnightInTimezone(tz: string): number {
  const now = DateTime.now().setZone(tz);
  const tomorrowMidnight = now.plus({ days: 1 }).startOf('day');
  const seconds = Math.floor(tomorrowMidnight.diff(now, 'seconds').seconds);
  return Math.max(0, seconds);
}
