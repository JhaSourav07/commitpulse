// lib/calculate.ts
import type {
  ContributionCalendar,
  ContributionDay,
  ContributionWeek,
  StreakStats,
  MonthlyStats,
} from '../types';

/* ==========================================================================
 * UTILITY FUNCTIONS
 * ========================================================================== */

/**
 * Safely calculates and rounds a percentage fraction to prevent NaN or
 * Infinity division values when the total denominator resolves to zero.
 */
export function calculateSafePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/* ==========================================================================
 * STREAK & CALENDAR CALCULATIONS
 * ========================================================================== */

export function convertLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): string {
  try {
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(utcDate);
    const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const tzYear = parseInt(partMap.year, 10);
    const tzMonth = parseInt(partMap.month, 10);
    const tzDay = parseInt(partMap.day, 10);
    let tzHour = parseInt(partMap.hour, 10);
    if (tzHour === 24) tzHour = 0;
    const tzMin = parseInt(partMap.minute, 10);
    const tzSec = parseInt(partMap.second, 10);

    const tzUtcTime = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec);
    const offsetMs = tzUtcTime - utcDate.getTime();
    const targetUtcTime = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMs;
    return new Date(targetUtcTime).toISOString().replace('.000Z', 'Z');
  } catch {
    // Fallback to UTC if timezone is invalid or Intl throws
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
      .toISOString()
      .replace('.000Z', 'Z');
  }
}

export function getLocalTodayStr(now: Date, timezone: string): string {
  // Candidate dates are around the UTC date of now
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth(); // 0-indexed
  const utcDate = now.getUTCDate();

  // We check candidates from 1 day before to 1 day after the UTC date
  for (let offset = -1; offset <= 1; offset++) {
    const candidateDate = new Date(Date.UTC(utcYear, utcMonth, utcDate + offset));
    const y = candidateDate.getUTCFullYear();
    const m = candidateDate.getUTCMonth() + 1;
    const d = candidateDate.getUTCDate();

    const dateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

    // Get the UTC time for local midnight (00:00:00) and next midnight (24:00:00 / 00:00:00 of next day)
    const midnightUtcStr = convertLocalToUtc(y, m, d, 0, 0, 0, timezone);
    const nextMidnightUtcStr = convertLocalToUtc(y, m, d + 1, 0, 0, 0, timezone);

    const midnightTime = new Date(midnightUtcStr).getTime();
    const nextMidnightTime = new Date(nextMidnightUtcStr).getTime();

    const nowTime = now.getTime();
    // Inclusive start, exclusive end: [midnight, next_midnight)
    if (nowTime >= midnightTime && nowTime < nextMidnightTime) {
      return dateStr;
    }
  }

  // Fallback to standard Intl.DateTimeFormat if logic doesn't match
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    return now.toISOString().split('T')[0];
  }
}

export function isStreakAlive(
  today?: { contributionCount: number } | null,
  yesterday?: { contributionCount: number } | null
): boolean {
  if (!today) {
    return (yesterday?.contributionCount ?? 0) > 0;
  }
  return today.contributionCount > 0 || (yesterday?.contributionCount ?? 0) > 0;
}

export function findTodayIndex(
  days?: ContributionDay[] | null,
  timezone?: string | null,
  now?: Date | null
): number {
  if (!days || !Array.isArray(days)) {
    return -1;
  }
  const tz = timezone || 'UTC';
  const currentDate = now || new Date();
  const localTodayStr = getLocalTodayStr(currentDate, tz);

  const localTodayIndex = days.findIndex((d) => d && d.date === localTodayStr);

  return localTodayIndex !== -1 ? localTodayIndex : -1;
}

export function calculateStreak(
  calendar?: ContributionCalendar | null,
  timezone: string = 'UTC',
  now: Date = new Date(),
  grace: number = 1
): StreakStats {
  const localTodayStr = getLocalTodayStr(now, timezone);

  if (!calendar) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalContributions: 0,
      todayDate: localTodayStr,
    };
  }

  const weeks = calendar.weeks || [];
  const days = weeks.flatMap((week) => week?.contributionDays || []).filter(Boolean);

  const seen = new Set<string>();
  const uniqueDays = days.filter((d) => {
    if (!d || seen.has(d.date)) return false;
    seen.add(d.date);
    return true;
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // 1. Calculate Longest Streak (Standard loop)
  for (const day of uniqueDays) {
    if (day && day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // 2. Calculate Current Streak (Backwards loop with Grace Period)
  let todayIndex = findTodayIndex(uniqueDays, timezone, now);

  if (todayIndex < 0) {
    const lastIndex = uniqueDays.length - 1;
    if (lastIndex < 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalContributions: calendar.totalContributions || 0,
        todayDate: localTodayStr,
      };
    }

    const lastDateStr = uniqueDays[lastIndex]?.date;

    if (lastDateStr && localTodayStr > lastDateStr) {
      todayIndex = lastIndex;
    } else {
      return {
        currentStreak: 0,
        longestStreak,
        totalContributions: calendar.totalContributions || 0,
        todayDate: localTodayStr,
      };
    }
  }

  let consecutiveZeroDays = 0;
  if (todayIndex >= 0) {
    let idx = todayIndex - 1;
    while (idx >= 0 && uniqueDays[idx].contributionCount === 0) {
      consecutiveZeroDays++;
      idx--;
    }
  }

  const isActualToday = todayIndex >= 0 && uniqueDays[todayIndex].date === localTodayStr;
  const todayHasCommits = todayIndex >= 0 && uniqueDays[todayIndex].contributionCount > 0;

  // If we are looking at the actual today, and it has no commits,
  const evaluationIndex =
    isActualToday && !todayHasCommits && consecutiveZeroDays < Math.max(1, grace)
      ? todayIndex - 1
      : todayIndex;

  let isStreakAlive = false;
  for (let i = 0; i <= grace; i++) {
    const checkIndex = evaluationIndex - i;
    if (checkIndex >= 0 && uniqueDays[checkIndex] && uniqueDays[checkIndex].contributionCount > 0) {
      isStreakAlive = true;
      break;
    }
  }

  if (isStreakAlive) {
    let i = evaluationIndex;
    while (
      i >= evaluationIndex - grace &&
      i >= 0 &&
      uniqueDays[i] &&
      uniqueDays[i].contributionCount === 0
    ) {
      i--;
    }
    while (i >= 0 && uniqueDays[i] && uniqueDays[i].contributionCount > 0) {
      currentStreak++;
      i--;
    }
  } else {
    currentStreak = 0;
  }

  const todayDate = uniqueDays[todayIndex]?.date ?? localTodayStr;

  return {
    currentStreak,
    longestStreak,
    totalContributions: calendar.totalContributions || 0,
    todayDate,
  };
}

export function calculateMonthlyStats(
  calendar?: ContributionCalendar | null,
  timezone: string = 'UTC',
  now: Date = new Date()
): MonthlyStats {
  const currentMonthName = (() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone || 'UTC',
        month: 'long',
      }).format(now || new Date());
    } catch {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'long',
      }).format(now || new Date());
    }
  })();

  if (!calendar) {
    return {
      currentMonthTotal: 0,
      previousMonthTotal: 0,
      deltaPercentage: null,
      deltaAbsolute: 0,
      currentMonthName,
    };
  }

  const weeks = calendar.weeks || [];
  const days = weeks.flatMap((week) => week?.contributionDays || []).filter(Boolean);

  const localTodayStr = getLocalTodayStr(now || new Date(), timezone || 'UTC');
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
    if (day && day.date) {
      if (day.date.startsWith(currentMonthPrefix)) {
        currentMonthTotal += day.contributionCount || 0;
      } else if (day.date.startsWith(prevMonthPrefix)) {
        previousMonthTotal += day.contributionCount || 0;
      }
    }
  }

  const expectedPrevMonthStart = `${prevMonthPrefix}-01`;
  const expectedCurrentMonthEnd = localTodayStr;

  let firstDate = '';
  let lastDate = '';
  if (days.length > 0) {
    let minDate = days[0]?.date || '';
    let maxDate = days[0]?.date || '';
    for (const d of days) {
      if (d && d.date) {
        if (!minDate || d.date < minDate) minDate = d.date;
        if (!maxDate || d.date > maxDate) maxDate = d.date;
      }
    }
    firstDate = minDate;
    lastDate = maxDate;
  }

  const hasDays = days.length > 0 && firstDate !== '' && lastDate !== '';
  const isPrevMonthComplete = hasDays && firstDate <= expectedPrevMonthStart;
  const isCurrentMonthComplete = hasDays && lastDate >= expectedCurrentMonthEnd;
  const isCalendarComplete = isPrevMonthComplete && isCurrentMonthComplete;

  const deltaAbsolute = currentMonthTotal - previousMonthTotal;
  // When there is no baseline (previous month = 0), or the calendar is incomplete,
  // the percentage change is mathematically undefined or untrustworthy.
  // Return null so the renderer can display 'N/A' instead of misleading metrics.
  const deltaPercentage: number | null =
    !isCalendarComplete || previousMonthTotal === 0
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
export function aggregateCalendars(
  calendars?: ContributionCalendar[] | null
): ContributionCalendar {
  if (!calendars || !Array.isArray(calendars) || calendars.length === 0) {
    return { totalContributions: 0, weeks: [] };
  }

  // Calculate total contributions across all calendars
  const totalContributions = calendars.reduce(
    (sum, cal) => sum + (cal?.totalContributions || 0),
    0
  );

  // Use a Map keyed by the date string 'YYYY-MM-DD' to safely aggregate daily counts
  const dateMap = new Map<string, number>();

  // Find the calendar with the most weeks to serve as our structural base
  let baseCalendar = calendars[0];
  for (const cal of calendars) {
    if (!cal) continue;
    if ((cal.weeks?.length || 0) > (baseCalendar?.weeks?.length || 0)) {
      baseCalendar = cal;
    }

    // Populate the Map with all contributions from all calendars
    (cal.weeks || []).forEach((week) => {
      (week?.contributionDays || []).forEach((day) => {
        if (day && day.date) {
          const currentCount = dateMap.get(day.date) || 0;
          dateMap.set(day.date, currentCount + (day.contributionCount || 0));
        }
      });
    });
  }

  if (!baseCalendar) {
    return { totalContributions: 0, weeks: [] };
  }

  const aggregatedBase: ContributionCalendar = structuredClone(baseCalendar);

  aggregatedBase.totalContributions = totalContributions;

  // Re-map the structural base using our aggregated date map
  (aggregatedBase.weeks || []).forEach((week) => {
    (week?.contributionDays || []).forEach((day) => {
      if (day && day.date) {
        day.contributionCount = dateMap.get(day.date) || 0;
      }
    });
  });

  const existingDates = new Set<string>();

  (aggregatedBase.weeks || []).forEach((week) => {
    (week?.contributionDays || []).forEach((day) => {
      if (day && day.date) {
        existingDates.add(day.date);
      }
    });
  });

  const missingDays: ContributionDay[] = [];

  for (const [date, contributionCount] of dateMap.entries()) {
    if (!existingDates.has(date)) {
      missingDays.push({
        date,
        contributionCount,
      });
    }
  }

  missingDays.sort((a, b) => a.date.localeCompare(b.date));

  if (!aggregatedBase.weeks) {
    aggregatedBase.weeks = [];
  }
  for (const day of missingDays) {
    aggregatedBase.weeks.push({
      contributionDays: [day],
    });
  }
  return aggregatedBase;
}

/**
 * Chunks a flat, date-ordered list of contribution days into weekday-aligned weeks,
 * starting a new week on each Sunday. This mirrors GitHub's calendar layout so the
 * renderers keep their week (column) and weekday (row) grid instead of collapsing
 * every day into a single week.
 */
export function chunkDaysIntoWeeks(days?: ContributionDay[] | null): ContributionCalendar['weeks'] {
  if (!days || !Array.isArray(days)) {
    return [];
  }
  const weeks: ContributionCalendar['weeks'] = [];
  let currentWeek: ContributionDay[] = [];

  for (const day of days) {
    if (!day || !day.date) continue;

    // Safety check for date parser
    const parsedDate = new Date(day.date);
    if (isNaN(parsedDate.getTime())) {
      continue;
    }

    if (currentWeek.length > 0 && parsedDate.getUTCDay() === 0) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }
    currentWeek.push(day);
  }

  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

  return weeks;
}

/**
 * Processes a calendar to generate deep insights for "GitHub Wrapped"
 */
export function calculateWrappedStats(calendar?: ContributionCalendar | null) {
  if (!calendar) {
    return {
      totalContributions: 0,
      mostActiveDate: 'N/A',
      highestDailyCount: 0,
      busiestMonth: 'N/A',
      weekendRatio: 0,
    };
  }

  const weeks = calendar.weeks || [];
  const days = weeks.flatMap((w) => w?.contributionDays || []).filter(Boolean);

  let mostActiveDay = { date: 'N/A', count: 0 };
  const monthCounts: Record<string, number> = {};
  let weekendCommits = 0;
  let weekdayCommits = 0;

  days.forEach((day) => {
    if (!day || !day.date) return;

    // Safety check for date parser
    const dateObj = new Date(day.date);
    if (isNaN(dateObj.getTime())) {
      return;
    }

    const count = day.contributionCount || 0;
    // 1. Highest single day
    if (count > mostActiveDay.count) {
      mostActiveDay = { date: day.date, count };
    }

    // 2. Busiest month
    const month = day.date.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + count;

    // 3. Weekday vs Weekend grind
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday, 6 = Saturday (UTC)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCommits += count;
    } else {
      weekdayCommits += count;
    }
  });

  // Find busiest month string
  const busiestMonthStr =
    Object.keys(monthCounts).length === 0
      ? 'N/A'
      : Object.keys(monthCounts).reduce((a, b) => (monthCounts[a] > monthCounts[b] ? a : b));

  const total = weekendCommits + weekdayCommits;

  return {
    totalContributions: calendar.totalContributions || 0,
    mostActiveDate: mostActiveDay.date,
    highestDailyCount: mostActiveDay.count,
    busiestMonth: busiestMonthStr,
    weekendRatio: calculateSafePercentage(weekendCommits, total),
  };
}

/**
 * Normalizes a contribution calendar to a target timezone.
 *
 * This function converts each contribution day's date to the target timezone
 * and re-groups the days by the target timezone's midnight boundaries.
 * This is essential for accurate comparisons between users in different timezones.
 *
 * @param calendar - The contribution calendar to normalize
 * @param targetTimezone - The target timezone to normalize to (e.g., 'UTC', 'America/New_York')
 * @returns A new calendar with dates normalized to the target timezone
 */
export function normalizeCalendarToTimezone(
  calendar: ContributionCalendar,
  targetTimezone: string
): ContributionCalendar {
  if (!calendar || !calendar.weeks || calendar.weeks.length === 0) {
    return calendar;
  }

  // Flatten all contribution days
  const allDays = calendar.weeks.flatMap((week) => week.contributionDays || []);

  // Group contributions by target timezone date
  const dateMap = new Map<string, number>();

  for (const day of allDays) {
    if (!day || !day.date) continue;

    const currentCount = dateMap.get(day.date) || 0;
    dateMap.set(day.date, currentCount + (day.contributionCount || 0));
  }

  // Sort dates and create weeks
  const sortedDates = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Group into weeks (Sunday to Saturday)
  const weeks: ContributionWeek[] = [];
  let currentWeek: ContributionDay[] = [];

  for (const [date, contributionCount] of sortedDates) {
    const [yearStr, monthStr, dayStr] = date.split('-');
    const dateObj = new Date(
      Date.UTC(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10))
    );
    const dayOfWeek = dateObj.getUTCDay();

    // Start a new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push({ contributionDays: currentWeek });
      currentWeek = [];
    }

    currentWeek.push({ date, contributionCount });
  }

  // Add the last week
  if (currentWeek.length > 0) {
    weeks.push({ contributionDays: currentWeek });
  }

  return {
    totalContributions: calendar.totalContributions,
    weeks,
    lastSyncedAt: calendar.lastSyncedAt,
  };
}
