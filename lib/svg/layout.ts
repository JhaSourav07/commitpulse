import type { ContributionCalendar } from '../../types';

// constants
const GHOST_HEIGHT_PX = 4;
const LOG_SCALE_MULTIPLIER = 12;
const LINEAR_SCALE_MULTIPLIER = 5;
const MAX_LOG_HEIGHT = 80;
const MAX_LINEAR_HEIGHT = 50;

/** Shared layout data for a single isometric tower. */
export interface FaceOpacity {
  left: number;
  right: number;
  top: number;
}

export interface TowerData {
  x: number;
  y: number;
  h: number;
  hasCommits: boolean;
  isGhost: boolean;
  isToday: boolean;
  isTodayWithCommits: boolean;
  tooltip: string;
  contributionCount: number;
  faceOpacity: FaceOpacity;
  strokeOpacity: number;
  strokeWidth: number;
  /** Grid position used to compute the staggered animation-delay (row + col) * offset */
  row: number;
  col: number;
}

function computeTowerHeight(
  count: number,
  scale: 'linear' | 'log',
  shouldShowGhostCity: boolean
): number {
  if (count === 0 && shouldShowGhostCity) return GHOST_HEIGHT_PX;
  if (count === 0) return 0;
  return scale === 'log'
    ? Math.min(Math.log2(count + 1) * LOG_SCALE_MULTIPLIER, MAX_LOG_HEIGHT)
    : Math.min(count * LINEAR_SCALE_MULTIPLIER, MAX_LINEAR_HEIGHT);
}

function computeFaceOpacity(count: number, isGhostCityMode: boolean): FaceOpacity {
  if (isGhostCityMode) {
    return { left: 0, right: 0, top: 0.02 };
  }
  if (count === 0) {
    return { left: 0, right: 0, top: 0.02 };
  }
  return { left: 0.35, right: 0.21, top: 0.7 };
}

/**
 * Computes tower positions and heights from the last 14 weeks of
 * contribution data. The layout math is identical for both the
 * static-theme and auto-theme rendering paths.
 */
export function computeTowers(
  calendar: ContributionCalendar,
  scale: 'linear' | 'log' = 'linear',
  todayDate: string = ''
): TowerData[] {
  const weeks = calendar.weeks.slice(-14);
  const towers: TowerData[] = [];

  // Calculate if the entire monolith is empty
  let totalVisibleContributions = 0;
  weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      totalVisibleContributions += day.contributionCount;
    });
  });

  const shouldShowGhostCity = totalVisibleContributions === 0;

  // Pre-check: is todayDate present in the visible 14-week window?
  // If not (e.g. stale cache or todayDate outside the window), fall back to
  // marking the last visible day as "today" so the pulse always appears.
  const todayInWindow = weeks.some((w) => w.contributionDays.some((d) => d.date === todayDate));

  weeks.forEach((week, i) => {
    week.contributionDays.forEach((day, j) => {
      // Use the caller-supplied local date so the pulse animation fires on the
      // correct tower for users in non-UTC timezones, not always the last UTC entry.
      const isToday =
        day.date === todayDate ||
        // Fallback: if todayDate isn't in the visible window, keep the old behaviour.
        (!todayInWindow && i === weeks.length - 1 && j === week.contributionDays.length - 1);
      const hasCommits = day.contributionCount > 0;
      const isGhost = !hasCommits && shouldShowGhostCity;
      const isTodayWithCommits = isToday && hasCommits;

      const tooltip = isTodayWithCommits
        ? `TODAY: ${day.date}: ${day.contributionCount} contributions`
        : `${day.date}: ${day.contributionCount} contributions`;

      towers.push({
        x: 300 + (i - j) * 16,
        y: 120 + (i + j) * 9,
        h: computeTowerHeight(day.contributionCount, scale, shouldShowGhostCity),
        hasCommits,
        isGhost,
        isToday,
        isTodayWithCommits,
        tooltip,
        contributionCount: day.contributionCount,
        faceOpacity: computeFaceOpacity(day.contributionCount, shouldShowGhostCity),
        strokeOpacity: isGhost ? 0.3 : 0,
        strokeWidth: isGhost ? 0.5 : 0,
        row: i,
        col: j,
      });
    });
  });

  return towers;
}
