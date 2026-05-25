// lib/calculate.ts
import type { ContributionCalendar, StreakStats, MonthlyStats } from '../types';

/*
Calculates streak statistics from a GitHub contribution calendar.

This function computes:
- Current streak length (with a one-day grace period)
- Longest streak length across the calendar
- Total contributions made
- Effective "today" date used for UI display

Current Streak Logic:
The streak remains active if there are no contributions today
but there were contributions yesterday. This prevents streaks
from breaking prematurely due to timezone differences.

Timezone Handling:
Contribution dates are calendar-based. The provided IANA timezone
determines what "today" means for the user, ensuring streaks are
calculated correctly in local time (e.g., "Asia/Kolkata",
"America/Los_Angeles"). Defaults to "UTC".

@param {ContributionCalendar} calendar
  GitHub contribution calendar data containing weekly entries.

@param {string} [timezone='UTC']
  IANA timezone string used to determine the local date.

@param {Date} [now=new Date()]
  Current time reference for calculations. Useful for testing
  or overriding the system clock.

@returns {StreakStats}
  An object with:
  - currentStreak: active streak length
  - longestStreak: longest historical streak
  - totalContributions: total contribution count
  - todayDate: effective date used for streak/UI calculations

@example
// Calculate streak stats using a specific timezone
const stats = calculateStreak(calendar, 'Asia/Kolkata');

@example
// Override both timezone and current time (useful in tests)
const stats = calculateStreak(
  calendar,
  'America/Los_Angeles',
  new Date('2026-05-25T10:00:00Z')
);
*/

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

/*
  Calculates monthly contribution statistics from a GitHub contribution calendar.

  Figures out how many contributions were made this month and last month, then compares them.

  @param {ContributionCalendar} calendar
    Weekly GitHub contribution data.

 @param {string} [timezone='UTC']
    Timezone to decide which month is "current".
    Example: 'Asia/Kolkata' ensures local month is used.

  @param {Date} [now=new Date()]
    Current date/time reference (useful for testing).

  @returns {MonthlyStats}
   - currentMonthTotal: contributions this month
   - previousMonthTotal: contributions last month
   - deltaAbsolute: difference (this − last)
   - deltaPercentage: % change, rounded
   - currentMonthName: name of this month (e.g. "May")

  @example
  const stats = calculateMonthlyStats(calendar, 'Asia/Kolkata');
  stats.currentMonthName → "May"
  stats.deltaPercentage → 42
*/

export function calculateMonthlyStats(
  calendar: ContributionCalendar,
  timezone: string = 'UTC',
  now: Date = new Date()
): MonthlyStats {
  const days = calendar.weeks.flatMap((week) => week.contributionDays);

  const localTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const [currentYearStr, currentMonthStr] = localTodayStr.split('-');
  const currentYear = parseInt(currentYearStr, 10);
  const currentMonth = parseInt(currentMonthStr, 10);

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentMonthPrefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  const prevMonthPrefix = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;

  let currentMonthTotal = 0;
  let previousMonthTotal = 0;

  for (const day of days) {
    if (day.date.startsWith(currentMonthPrefix)) {
      currentMonthTotal += day.contributionCount;
    } else if (day.date.startsWith(prevMonthPrefix)) {
      previousMonthTotal += day.contributionCount;
    }
  }

  const currentMonthName = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'long',
  }).format(now);

  const deltaAbsolute = currentMonthTotal - previousMonthTotal;
  let deltaPercentage = 0;

  if (previousMonthTotal === 0) {
    if (currentMonthTotal > 0) {
      deltaPercentage = 100;
    }
  } else {
    deltaPercentage = Math.round((deltaAbsolute / previousMonthTotal) * 100);
    if (deltaPercentage === -0) deltaPercentage = 0;
  }

  return {
    currentMonthTotal,
    previousMonthTotal,
    deltaPercentage,
    deltaAbsolute,
    currentMonthName,
  };
}
