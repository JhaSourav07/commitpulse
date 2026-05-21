// utils/time.ts

export function getSecondsUntilUTCMidnight(): number {
  const now = new Date();

  // Create a Date object for the upcoming midnight in UTC
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );

  // Return the difference in seconds
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

// Returns seconds until midnight in the given IANA timezone (e.g. 'America/New_York').
// Used to set CDN cache TTLs that reset at the user's local midnight rather than UTC midnight.
// Note: on DST transition days (spring-forward/fall-back) the day is 23 or 25 hours,
// so the returned TTL can be off by up to one hour on those two days per year — acceptable
// for a cache TTL.
export function getSecondsUntilMidnightInTimezone(tz: string): number {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

  // hour24 can return 24 at midnight in some Intl implementations; normalise with % 24
  const hour = get('hour') % 24;
  const minute = get('minute');
  const second = get('second');

  return 86400 - (hour * 3600 + minute * 60 + second);
}
