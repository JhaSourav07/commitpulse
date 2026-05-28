// lib/svg/layout.ts

import type { ContributionCalendar } from '../../types';
import {
  GHOST_HEIGHT_PX,
  LOG_SCALE_MULTIPLIER,
  LINEAR_SCALE_MULTIPLIER,
  MAX_LOG_HEIGHT,
  MAX_LINEAR_HEIGHT,
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

  // Calculate if the entire monolith is empty based on the selected mode metric
  let totalVisibleContributions = 0;
  weeks.forEach((week) => {
    week.contributionDays.forEach((day) => {
      const count =
        mode === 'loc' ? (day.locAdditions || 0) + (day.locDeletions || 0) : day.contributionCount;
      totalVisibleContributions += count;
    });
  });

  const shouldShowGhostCity = totalVisibleContributions === 0;

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

      const unit = mode === 'loc' ? 'lines of code' : 'contributions';
      const tooltip = isTodayWithCommits
        ? `TODAY: ${day.date}: ${count} ${unit}`
        : `${day.date}: ${count} ${unit}`;

      // Isometric projection: Maps 2D grid coordinates (i, j) to a 3D isometric screen space.
      // - Origin: (300, 120) anchors the grid layout on the SVG canvas.
      // - Indices: 'i' represents the week/column index; 'j' represents the day/row index.
      // - Geometry:
      //   * (i - j) * 16 handles the horizontal shift. Increasing 'i' moves right; increasing 'j' moves left.
      //   * (i + j) * 9 handles the vertical depth. Both indices move the tile downward.
      // - Constants: 16 and 9 represent half-widths and half-heights of the diamond tiles,
      //   maintaining a clean ~2:1 aspect ratio for isometric perspective.
      towers.push({
        x: 300 + (i - j) * 16,
        y: 120 + (i + j) * 9,
        h: computeTowerHeight(count, scale, shouldShowGhostCity),
        hasCommits,
        isGhost,
        isToday,
        isTodayWithCommits,
        tooltip,
        contributionCount: count,
        faceOpacity: computeFaceOpacity(count, shouldShowGhostCity),
        strokeOpacity: isGhost ? 0.3 : 0,
        strokeWidth: isGhost ? 0.5 : 0,
        row: i,
        col: j,
      });
    });
  });

  return towers;
}
