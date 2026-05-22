// lib/calculate.ts
import type { ContributionCalendar, StreakStats } from '../types';

export function calculateStreak(
  calendar: ContributionCalendar,
  timezone: string = 'UTC',
  now: Date = new Date()
): StreakStats {
  const weeks = calendar.weeks;
  const days = weeks.flatMap((week) => week.contributionDays);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // 1. Calculate Longest Streak (Standard loop)
  for (const day of days) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // 2. Calculate Current Streak (Backwards loop with Grace Period)
  // Find "today" in the user's timezone. Without this, a user in UTC-8 at 07:00 UTC
  // (still the previous calendar day locally) would have the UTC "today" — which has
  // no commits yet — treated as their current day, silently breaking their streak.
  const localTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const localTodayIndex = days.findIndex((d) => d.date === localTodayStr);
  // If the local date isn't in the GitHub data (timezone ahead of UTC, or calendar
  // doesn't extend to today), fall back to the last available day.
  const todayIndex = localTodayIndex !== -1 ? localTodayIndex : days.length - 1;

  if (todayIndex < 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: calendar.totalContributions,
      todayDate: localTodayStr,
    };
  }

  const today = days[todayIndex];
  const yesterday = todayIndex > 0 ? days[todayIndex - 1] : null;

  // If I committed today, the streak is alive.
  // If I haven't committed today, but I committed yesterday,
  // the streak is STILL alive (Grace Period).
  const isStreakAlive = today.contributionCount > 0 || (yesterday?.contributionCount ?? 0) > 0;

  if (isStreakAlive) {
    // Count backwards from the first day that has a contribution
    // starting from either today or yesterday.
    let i = today.contributionCount > 0 ? todayIndex : todayIndex - 1;

    while (i >= 0 && days[i].contributionCount > 0) {
      currentStreak++;
      i--;
    }
  } else {
    currentStreak = 0;
  }

  // When the local date isn't in the calendar (e.g. UTC+14 user whose local date is
  // already tomorrow), fall back to the last available day so todayDate always refers
  // to a date that exists in the calendar and the SVG pulse can match it.
  const todayDate =
    localTodayIndex !== -1 ? localTodayStr : (days[todayIndex]?.date ?? localTodayStr);

  return {
    currentStreak,
    longestStreak,
    totalContributions: calendar.totalContributions,
    todayDate,
  };
}
