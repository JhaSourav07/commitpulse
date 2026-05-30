// lib/calculate.ts
import type { ContributionCalendar, StreakStats, MonthlyStats } from '../types';
import type { ForecastData, ForecastDay } from '../types/dashboard';

/* ==========================================================================
 * STREAK & CALENDAR CALCULATIONS
 * ========================================================================== */

export function isStreakAlive(
  today: { contributionCount: number },
  yesterday: { contributionCount: number } | null
): boolean {
  return today.contributionCount > 0 || (yesterday?.contributionCount ?? 0) > 0;
}

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

/* ==========================================================================
 * CONTRIBUTION FORECAST
 * ========================================================================== */

/**
 * Day-of-week activity weights derived from typical open-source contribution
 * patterns. Weekdays (Mon–Fri) are slightly up-weighted; weekends are reduced.
 * The weights are relative multipliers applied on top of the WMA baseline so
 * the forecast respects the developer's personal weekly rhythm.
 *
 * Index 0 = Sunday … Index 6 = Saturday (matches Date.getDay()).
 */
const DOW_WEIGHTS = [0.6, 1.1, 1.15, 1.15, 1.1, 1.05, 0.65] as const;

/**
 * Computes a Weighted Moving Average over the last `windowSize` values.
 * More recent values receive linearly higher weights.
 *
 * e.g. window [a, b, c] → weight 1·a + 2·b + 3·c / (1+2+3)
 */
function weightedMovingAverage(values: number[], windowSize: number = 28): number {
  const slice = values.slice(-windowSize);
  if (slice.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < slice.length; i++) {
    const weight = i + 1; // linear ramp: oldest = 1, newest = slice.length
    weightedSum += slice[i] * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculates contribution forecasts from a historical ContributionCalendar.
 *
 * Algorithm overview:
 *   1. Extract all days from the calendar chronologically.
 *   2. Compute the Weighted Moving Average (WMA) of the last 28 days.
 *   3. For the next 7 days, multiply WMA × DOW weight for that day-of-week
 *      to produce a per-day forecast that respects weekly patterns.
 *   4. Month-end projection = current month actual + (days remaining × WMA).
 *   5. Year-end projection = year-to-date actual + (days remaining in year × rolling 30-day avg).
 *
 * @param calendar   - Full ContributionCalendar from the GitHub API.
 * @param now        - Allows deterministic testing by injecting a fixed "today".
 */
export function calculateForecast(
  calendar: ContributionCalendar,
  now: Date = new Date()
): ForecastData {
  const allDays = calendar.weeks.flatMap((w) => w.contributionDays);

  // ── 1. Determine "today" in UTC ───────────────────────────────────────────
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Only use days up to and including today (don't peek at future days from the
  // GitHub API which may include zero-padded future dates in the last week).
  const historicalDays = allDays.filter((d) => d.date <= todayStr);
  const counts = historicalDays.map((d) => d.contributionCount);

  // ── 2. Baseline metrics ───────────────────────────────────────────────────
  const wmaBaseline = weightedMovingAverage(counts, 28);

  // Rolling 30-day average (simple mean) for year-end projection — gives a
  // slightly different signal from WMA and smooths out short-term spikes.
  const last30 = counts.slice(-30);
  const rollingAvg30 = last30.length > 0 ? last30.reduce((a, b) => a + b, 0) / last30.length : 0;

  // ── 3. Current month stats ────────────────────────────────────────────────
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
  const currentMonthDays = historicalDays.filter((d) => d.date.startsWith(currentMonthPrefix));
  const currentMonthActual = currentMonthDays.reduce((s, d) => s + d.contributionCount, 0);

  // Days left in the month (including tomorrow onwards; today is already counted in actual)
  const todayDate = new Date(todayStr + 'T12:00:00Z');
  const lastDayOfMonth = new Date(
    Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 0)
  );
  const daysLeftInMonth = lastDayOfMonth.getUTCDate() - todayDate.getUTCDate(); // days after today

  // ── 4. Year-to-date stats ─────────────────────────────────────────────────
  const currentYearPrefix = todayStr.substring(0, 4); // YYYY
  const yearToDateActual = historicalDays
    .filter((d) => d.date.startsWith(currentYearPrefix))
    .reduce((s, d) => s + d.contributionCount, 0);

  const dayOfYear = Math.floor(
    (todayDate.getTime() - Date.UTC(todayDate.getUTCFullYear(), 0, 0)) / 86_400_000
  );
  const totalDaysInYear =
    todayDate.getUTCFullYear() % 4 === 0 &&
    (todayDate.getUTCFullYear() % 100 !== 0 || todayDate.getUTCFullYear() % 400 === 0)
      ? 366
      : 365;
  const daysRemainingInYear = totalDaysInYear - dayOfYear; // days after today

  // ── 5. Next-7-days forecast ───────────────────────────────────────────────
  const SHORT_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const next7Days: ForecastDay[] = [];

  for (let offset = 1; offset <= 7; offset++) {
    const forecastDate = new Date(todayDate.getTime() + offset * 86_400_000);
    const dow = forecastDate.getUTCDay(); // 0–6
    const predicted = Math.max(0, Math.round(wmaBaseline * DOW_WEIGHTS[dow]));
    const dateStr = forecastDate.toISOString().split('T')[0];
    next7Days.push({
      date: dateStr,
      dayLabel: SHORT_DAY_LABELS[dow],
      predicted,
    });
  }

  // ── 6. Projections ────────────────────────────────────────────────────────
  const endOfMonthProjection = Math.round(currentMonthActual + daysLeftInMonth * wmaBaseline);
  const yearEndProjection = Math.round(yearToDateActual + daysRemainingInYear * rollingAvg30);

  return {
    next7Days,
    endOfMonthProjection,
    yearEndProjection,
    dailyAverage: Math.round(rollingAvg30 * 10) / 10,
    currentMonthActual,
    daysLeftInMonth,
    yearToDateActual,
  };
}
