// lib/calculate.ts
import type { ContributionCalendar, StreakStats, MonthlyStats } from '../types';

/* ==========================================================================
 * STREAK & CALENDAR CALCULATIONS
 * ========================================================================== */

/**
 * Determines whether the user's contribution streak is still alive.
 *
 * A streak survives as long as at least one of these is true:
 * - Today has contributions, OR
 * - Yesterday had contributions (grace period: covers timezone edge cases
 *   where the GitHub API may not have updated yet for the current day)
 *
 * @param today - The contribution day object for today.
 * @param today.contributionCount - Number of contributions made today.
 * @param yesterday - The contribution day object for yesterday, or null if
 *   today is the very first day in the calendar (no prior day exists).
 * @returns `true` if the streak should be considered alive, `false` otherwise.
 *
 * @example
 * // Today has contributions — streak alive
 * isStreakAlive({ contributionCount: 3 }, { contributionCount: 0 }); // true
 *
 * @example
 * // Today is empty but yesterday had activity — grace period keeps it alive
 * isStreakAlive({ contributionCount: 0 }, { contributionCount: 5 }); // true
 *
 * @example
 * // Both days are empty — streak is dead
 * isStreakAlive({ contributionCount: 0 }, { contributionCount: 0 }); // false
 */

export function isStreakAlive(
  today: { contributionCount: number },
  yesterday: { contributionCount: number } | null
): boolean {
  return today.contributionCount > 0 || (yesterday?.contributionCount ?? 0) > 0;
}

/**
 * Calculates both the current and longest contribution streaks from a
 * GitHub contribution calendar, with support for timezones and a grace period.
 *
 * ### Algorithm — Longest Streak
 * A single forward pass over all contribution days. A counter increments for
 * each consecutive day with contributions > 0 and resets to 0 on any gap day.
 *
 * ### Algorithm — Current Streak (with Grace Period)
 * Works **backwards** from today's index in the flat day array:
 * 1. Resolve "today" using `Intl.DateTimeFormat` in the caller's timezone so
 *    the badge reflects the user's local date, not UTC.
 * 2. Check the `grace` window (default 1 day) — if any day within that window
 *    has contributions, the streak is considered alive. This handles the common
 *    case where a developer contributes before midnight in their timezone but
 *    GitHub's UTC-based API hasn't reflected it yet.
 * 3. If alive, skip any trailing grace-period zeros, then walk backwards
 *    counting consecutive contribution days.
 * 4. If not alive, current streak is 0.
 *
 * ### Edge Cases Handled
 * - Today's date does not appear in the calendar (e.g. GitHub lag): falls back
 *   to the last day in the array.
 * - Empty calendar (todayIndex < 0): returns zeroed-out stats immediately.
 * - Grace period overlap: trailing zeros within the grace window are skipped
 *   before the backwards count begins, so they are not mistakenly included.
 *
 * @param calendar - The full GitHub contribution calendar for one user/year.
 * @param timezone - IANA timezone string used to resolve "today" locally,
 *   e.g. `"America/New_York"`. Defaults to `"UTC"`.
 * @param now - The current date/time. Injectable for deterministic testing;
 *   defaults to `new Date()` in production.
 * @param grace - Number of days to look back when checking if the streak is
 *   still alive. Defaults to `1` (yesterday counts as grace). Set to `0` to
 *   disable grace entirely.
 * @returns A {@link StreakStats} object containing:
 *   - `currentStreak` — consecutive active days up to and including today
 *   - `longestStreak` — the all-time longest streak in the calendar
 *   - `totalContributions` — total from the calendar object
 *   - `todayDate` — the resolved local date string (`YYYY-MM-DD`)
 */

export function calculateStreak(
  calendar: ContributionCalendar,
  timezone: string = 'UTC',
  now: Date = new Date(),
  grace: number = 1
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
  const localTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const localTodayIndex = days.findIndex((d) => d.date === localTodayStr);
  const todayIndex = localTodayIndex !== -1 ? localTodayIndex : days.length - 1;

  if (todayIndex < 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: calendar.totalContributions,
      todayDate: localTodayStr,
    };
  }

  let isStreakAlive = false;
  for (let i = 0; i <= grace; i++) {
    const checkIndex = todayIndex - i;
    if (checkIndex >= 0 && days[checkIndex].contributionCount > 0) {
      isStreakAlive = true;
      break;
    }
  }

  if (isStreakAlive) {
    let i = todayIndex;
    while (i >= todayIndex - grace && i >= 0 && days[i].contributionCount === 0) {
      i--;
    }
    while (i >= 0 && days[i].contributionCount > 0) {
      currentStreak++;
      i--;
    }
  } else {
    currentStreak = 0;
  }

  const todayDate =
    localTodayIndex !== -1 ? localTodayStr : (days[todayIndex]?.date ?? localTodayStr);

  return {
    currentStreak,
    longestStreak,
    totalContributions: calendar.totalContributions,
    todayDate,
  };
}

/**
 * Computes contribution statistics for the current and previous calendar months.
 *
 * Resolves month boundaries using the caller's local timezone so that "this month"
 * matches what the user sees on their GitHub profile — not the server's UTC month.
 *
 * ### Delta Percentage Edge Case
 * When `previousMonthTotal` is 0, percentage change is mathematically undefined
 * (division by zero). The field is typed as `number | null` and returns `null`
 * in that case, signalling the renderer to display "N/A" rather than a
 * misleading hardcoded "+100%".
 *
 * @param calendar - The full GitHub contribution calendar for one user/year.
 * @param timezone - IANA timezone string used to determine the current month,
 *   e.g. `"Asia/Kolkata"`. Defaults to `"UTC"`.
 * @param now - The current date/time. Injectable for deterministic testing;
 *   defaults to `new Date()` in production.
 * @returns A {@link MonthlyStats} object containing:
 *   - `currentMonthTotal` — total contributions in the current calendar month
 *   - `previousMonthTotal` — total contributions in the immediately preceding month
 *   - `deltaAbsolute` — raw difference (`currentMonthTotal - previousMonthTotal`)
 *   - `deltaPercentage` — percentage change rounded to the nearest integer,
 *     or `null` if `previousMonthTotal` is 0 (undefined baseline)
 *   - `currentMonthName` — localised full month name, e.g. `"May"`
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
  // When there is no baseline (previous month = 0), the percentage change is
  // mathematically undefined. Return null so the renderer can display 'N/A'
  // instead of the misleading hardcoded +100%.
  const deltaPercentage: number | null =
    previousMonthTotal === 0
      ? null
      : (() => {
          const pct = Math.round((deltaAbsolute / previousMonthTotal) * 100);
          return pct === -0 ? 0 : pct;
        })();

  return {
    currentMonthTotal,
    previousMonthTotal,
    deltaPercentage,
    deltaAbsolute,
    currentMonthName,
  };
}

/* ==========================================================================
 * EPIC FEATURES (ORG AGGREGATION & GITHUB WRAPPED)
 * ========================================================================== */

/**
 * Aggregates multiple user contribution calendars into a single "Mega-City" calendar.
 * Used for Organization and Team dashboards.
 */
export function aggregateCalendars(calendars: ContributionCalendar[]): ContributionCalendar {
  if (calendars.length === 0) {
    return { totalContributions: 0, weeks: [] };
  }

  // Calculate total contributions across all calendars
  const totalContributions = calendars.reduce((sum, cal) => sum + cal.totalContributions, 0);

  // Use a Map keyed by the date string 'YYYY-MM-DD' to safely aggregate daily counts
  const dateMap = new Map<string, number>();

  // Find the calendar with the most weeks to serve as our structural base
  let baseCalendar = calendars[0];
  for (const cal of calendars) {
    if (cal.weeks.length > baseCalendar.weeks.length) {
      baseCalendar = cal;
    }

    // Populate the Map with all contributions from all calendars
    cal.weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        const currentCount = dateMap.get(day.date) || 0;
        dateMap.set(day.date, currentCount + day.contributionCount);
      });
    });
  }

  // Deep clone the base calendar so we don't mutate the original object
  const aggregatedBase = JSON.parse(JSON.stringify(baseCalendar)) as ContributionCalendar;

  aggregatedBase.totalContributions = totalContributions;

  // Re-map the structural base using our aggregated date map
  aggregatedBase.weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      day.contributionCount = dateMap.get(day.date) || 0;
    });
  });

  return aggregatedBase;
}
/**
 * Processes a calendar to generate deep insights for "GitHub Wrapped"
 */
export function calculateWrappedStats(calendar: ContributionCalendar) {
  const days = calendar.weeks.flatMap((w) => w.contributionDays);

  let mostActiveDay = { date: '', count: 0 };
  const monthCounts: Record<string, number> = {};
  let weekendCommits = 0;
  let weekdayCommits = 0;

  days.forEach((day) => {
    // 1. Highest single day
    if (day.contributionCount > mostActiveDay.count) {
      mostActiveDay = { date: day.date, count: day.contributionCount };
    }

    // 2. Busiest month
    const month = day.date.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + day.contributionCount;

    // 3. Weekday vs Weekend grind
    const dateObj = new Date(day.date);
    const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCommits += day.contributionCount;
    } else {
      weekdayCommits += day.contributionCount;
    }
  });

  // Find busiest month string
  const busiestMonthStr = Object.keys(monthCounts).reduce(
    (a, b) => (monthCounts[a] > monthCounts[b] ? a : b),
    ''
  );

  return {
    totalContributions: calendar.totalContributions,
    mostActiveDate: mostActiveDay.date,
    highestDailyCount: mostActiveDay.count,
    busiestMonth: busiestMonthStr,
    weekendRatio: Math.round((weekendCommits / (weekendCommits + weekdayCommits || 1)) * 100),
  };
}
