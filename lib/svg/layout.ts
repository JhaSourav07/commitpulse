// lib/svg/layout.ts

import type { ContributionCalendar } from '../../types';
import {
  GHOST_HEIGHT_PX,
  GRID_ORIGIN_X,
  GRID_ORIGIN_Y,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
  TILE_HEIGHT_HALF,
  TILE_WIDTH_HALF,
} from './layoutConstants';

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
  date: string;
  contributionCount: number;
  faceOpacity: FaceOpacity;
  strokeOpacity: number;
  strokeWidth: number;
  /** Grid position used to compute the staggered animation-delay (row + col) * offset */
  row: number;
  col: number;
  intensityLevel: number; // Quartile level (0 for no commits, 1 to 4 based on contribution intensity)
}

interface MinimalDay {
  contributionCount?: number;
  locAdditions?: number;
  locDeletions?: number;
}

interface MinimalWeek {
  contributionDays: MinimalDay[];
}

/**
 * Determines if the entire visible calendar monolith is empty (a "ghost city").
 * It returns true only if there are absolutely zero contributions (commits or LoC)
 * across all visible weeks.
 */
export function isGhostCity(weeks: MinimalWeek[]): boolean {
  return !weeks.some((week) =>
    week.contributionDays.some((day) => {
      const commits = day.contributionCount || 0;
      const loc = (day.locAdditions || 0) + (day.locDeletions || 0);
      return commits > 0 || loc > 0;
    })
  );
}

export function computeTowerHeight(
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

export function computeFaceOpacity(count: number, isGhostCityMode: boolean): FaceOpacity {
  if (isGhostCityMode) {
    return { left: 0, right: 0, top: 0.08 };
  }
  if (count === 0) {
    return { left: 0, right: 0, top: 0.08 };
  }
  return { left: 0.35, right: 0.21, top: 0.7 };
}

/**
 * Projects 2D grid coordinates (weekIndex, dayIndex) into 3D isometric screen coordinates.
 *
 * @param weekIndex The week column index (0 to 13).
 * @param dayIndex The day-of-week row index (0 to 6).
 * @returns Projected x and y coordinate offsets in pixels.
 */
export function projectIsometric(weekIndex: number, dayIndex: number): { x: number; y: number } {
  return {
    x: GRID_ORIGIN_X + (weekIndex - dayIndex) * TILE_WIDTH_HALF,
    y: GRID_ORIGIN_Y + (weekIndex + dayIndex) * TILE_HEIGHT_HALF,
  };
}

/**
 * Computes the full isometric tower layout used by the SVG renderer.
 *
 * Supports both standard commits and Lines of Code (LoC) mode.
 */
export function computeTowers(
  calendar: ContributionCalendar,
  scale: 'linear' | 'log' = 'linear',
  todayDate: string = '',
  mode: 'commits' | 'loc' = 'commits'
): TowerData[] {
  const weeks = calendar.weeks.slice(-14);
  const towers: TowerData[] = [];

  const shouldShowGhostCity = isGhostCity(weeks);

  // Calculate if the entire monolith is empty and retrieve the maximum count (commits or LoC)

  let maxCommits = 0;
  weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      const count =
        mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.contributionCount;

      if (count > maxCommits) {
        maxCommits = count;
      }
    });
  });

  // Pre-check: is todayDate present in the visible 14-week window?
  const todayInWindow = weeks.some((w) => w.contributionDays.some((d) => d.date === todayDate));

  weeks.forEach((week, i) => {
    week.contributionDays.forEach((day, j) => {
      const isToday =
        day.date === todayDate ||
        (!todayInWindow && i === weeks.length - 1 && j === week.contributionDays.length - 1);

      const count =
        mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.contributionCount;

      const hasCommits = count > 0;
      const isGhost = !hasCommits && shouldShowGhostCity;
      const isTodayWithCommits = isToday && hasCommits;

      const unit = mode === 'loc' ? 'est. lines of code' : 'contributions';
      const tooltip = isToday
        ? `TODAY: ${day.date}: ${count} ${unit}`
        : `${day.date}: ${count} ${unit}`;

      const dayOfWeekIndex = new Date(day.date).getUTCDay();
      const coords = projectIsometric(i, dayOfWeekIndex);

      let intensityLevel = 0;
      if (hasCommits) {
        if (maxCommits <= 4) {
          intensityLevel = Math.min(4, count);
        } else {
          const ratio = count / maxCommits;
          if (ratio <= 0.25) intensityLevel = 1;
          else if (ratio <= 0.5) intensityLevel = 2;
          else if (ratio <= 0.75) intensityLevel = 3;
          else intensityLevel = 4;
        }
      }

      towers.push({
        x: coords.x,
        y: coords.y,
        h: computeTowerHeight(count, scale, shouldShowGhostCity),
        hasCommits,
        isGhost,
        isToday,
        isTodayWithCommits,
        tooltip,
        date: day.date,
        contributionCount: count,
        faceOpacity: computeFaceOpacity(count, shouldShowGhostCity),
        strokeOpacity: isGhost ? 0.3 : 0,
        strokeWidth: isGhost ? 0.5 : 0,
        row: i,
        col: dayOfWeekIndex,
        intensityLevel,
      });
    });
  });

  return towers;
}
