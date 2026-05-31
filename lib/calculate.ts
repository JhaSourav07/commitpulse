// lib/calculate.ts
import type { ContributionCalendar, ContributionDay, StreakStats, MonthlyStats } from '../types';

/* ==========================================================================
 * STREAK & CALENDAR CALCULATIONS
 * ========================================================================== */

export function isStreakAlive(
  today: { contributionCount: number },
  yesterday: { contributionCount: number } | null
): boolean {
  return today.contributionCount > 0 || (yesterday?.contributionCount ?? 0) > 0;
}

export function findTodayIndex(days: ContributionDay[], timezone: string, now: Date): number {
  const localTodayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
  }).format(now);

  const localTodayIndex = days.findIndex((d) => d.date === localTodayStr);

  return localTodayIndex !== -1 ? localTodayIndex : days.length - 1;
}

export function calculateStreak(
  calendar: ContributionCalendar,
  timezone: string = 'UTC',
  now: Date = new Date(),
  grace: number = 1
): StreakStats {
  const weeks = calendar?.weeks || [];
  const days = weeks.flatMap((week) => week?.contributionDays || []);

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
  const todayIndex = findTodayIndex(days, timezone, now);

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

  const todayDate = days[todayIndex]?.date ?? localTodayStr;

  return {
    currentStreak,
    longestStreak,
    totalContributions: calendar.totalContributions,
    todayDate,
  };
}

export function calculateMonthlyStats(
  calendar: ContributionCalendar,
  timezone: string = 'UTC',
  now: Date = new Date()
): MonthlyStats {
  const weeks = calendar?.weeks || [];
  const days = weeks.flatMap((week) => week?.contributionDays || []);

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
    if ((cal.weeks?.length || 0) > (baseCalendar.weeks?.length || 0)) {
      baseCalendar = cal;
    }

    // Populate the Map with all contributions from all calendars
    (cal.weeks || []).forEach((week) => {
      (week?.contributionDays || []).forEach((day) => {
        const currentCount = dateMap.get(day.date) || 0;
        dateMap.set(day.date, currentCount + day.contributionCount);
      });
    });
  }

  // Deep clone the base calendar so we don't mutate the original object
  const aggregatedBase = JSON.parse(JSON.stringify(baseCalendar)) as ContributionCalendar;

  aggregatedBase.totalContributions = totalContributions;

  // Re-map the structural base using our aggregated date map
  (aggregatedBase.weeks || []).forEach((week) => {
    (week?.contributionDays || []).forEach((day) => {
      day.contributionCount = dateMap.get(day.date) || 0;
    });
  });

  return aggregatedBase;
}
/**
 * Processes a calendar to generate deep insights for "GitHub Wrapped"
 */
export function calculateWrappedStats(calendar: ContributionCalendar) {
  const weeks = calendar?.weeks || [];
  const days = weeks.flatMap((w) => w?.contributionDays || []);

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
