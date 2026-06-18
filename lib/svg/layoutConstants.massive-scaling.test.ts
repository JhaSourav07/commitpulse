import { describe, expect, it } from 'vitest';
import type { ContributionCalendar, ContributionDay } from '../../types';
import { computeTowerHeight, computeTowers, projectIsometric } from './layout';
import {
  GHOST_HEIGHT_PX,
  GRID_ORIGIN_X,
  GRID_ORIGIN_Y,
  LINEAR_SCALE_MULTIPLIER,
  LOG_SCALE_MULTIPLIER,
  MAX_LINEAR_HEIGHT,
  MAX_LOG_HEIGHT,
  TILE_HEIGHT_HALF,
  TILE_WIDTH_HALF,
} from './layoutConstants';

const now = () => performance.now();

function makeDay(weekIndex: number, dayIndex: number, count: number): ContributionDay {
  const dayNumber = weekIndex * 7 + dayIndex + 1;
  const date = new Date(Date.UTC(2020, 0, dayNumber)).toISOString().slice(0, 10);

  return {
    date,
    contributionCount: count,
    locAdditions: count * 100,
    locDeletions: count * 10,
  };
}

function makeCalendar(
  weekCount: number,
  countFor: (week: number, day: number) => number
): ContributionCalendar {
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) =>
      makeDay(weekIndex, dayIndex, countFor(weekIndex, dayIndex))
    ),
  }));

  return {
    totalContributions: weeks.reduce(
      (total, week) =>
        total +
        week.contributionDays.reduce((weekTotal, day) => weekTotal + day.contributionCount, 0),
      0
    ),
    weeks,
  };
}

describe('layoutConstants massive scaling', () => {
  it('keeps projected coordinates unique for thousands of contributor activity cells', () => {
    const cells = Array.from({ length: 5000 }, (_, index) => ({
      week: Math.floor(index / 7),
      day: index % 7,
    }));

    const start = now();
    const coordinates = cells.map(({ week, day }) => projectIsometric(week, day));
    const duration = now() - start;
    const keys = new Set(coordinates.map(({ x, y }) => `${x}:${y}`));

    expect(keys.size).toBe(cells.length);
    expect(coordinates[0]).toEqual({ x: GRID_ORIGIN_X, y: GRID_ORIGIN_Y });
    expect(coordinates.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(duration).toBeLessThan(50);
  });

  it('clamps extreme contribution heights to stable layout maximums', () => {
    const counts = Array.from({ length: 10000 }, (_, index) =>
      index % 2 === 0 ? index * 1000 : Number.MAX_SAFE_INTEGER - index
    );

    const start = now();
    const linearHeights = counts.map((count) => computeTowerHeight(count, 'linear', false));
    const logHeights = counts.map((count) => computeTowerHeight(count, 'log', false));
    const duration = now() - start;

    expect(linearHeights.every((height) => height >= 0 && height <= MAX_LINEAR_HEIGHT)).toBe(true);
    expect(logHeights.every((height) => height >= 0 && height <= MAX_LOG_HEIGHT)).toBe(true);
    expect(linearHeights).toContain(MAX_LINEAR_HEIGHT);
    expect(logHeights).toContain(MAX_LOG_HEIGHT);
    expect(computeTowerHeight(0, 'linear', true)).toBe(GHOST_HEIGHT_PX);
    expect(duration).toBeLessThan(75);
  });

  it('renders a massive calendar through computeTowers into the bounded visible grid', () => {
    const calendar = makeCalendar(2500, (week, day) => (week + day) % 17);

    const start = now();
    const towers = computeTowers(calendar, 'linear', '2099-12-31');
    const duration = now() - start;
    const coordinateKeys = new Set(towers.map(({ x, y }) => `${x}:${y}`));

    expect(towers).toHaveLength(14 * 7);
    expect(coordinateKeys.size).toBe(towers.length);
    expect(towers.every(({ h }) => h >= 0 && h <= MAX_LINEAR_HEIGHT)).toBe(true);
    expect(towers.every(({ row }) => row >= 0 && row < 14)).toBe(true);
    expect(towers.every(({ col }) => col >= 0 && col < 7)).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it('keeps LoC mode towers bounded when metrics are extremely high', () => {
    const calendar = makeCalendar(1800, (week, day) =>
      week % 2 === 0 ? Number.MAX_SAFE_INTEGER - day : (day + 1) * 250000
    );

    const start = now();
    const towers = computeTowers(calendar, 'log', '', 'loc');
    const duration = now() - start;

    expect(towers).toHaveLength(14 * 7);
    expect(towers.every(({ h }) => Number.isFinite(h) && h <= MAX_LOG_HEIGHT)).toBe(true);
    expect(towers.every(({ contributionCount }) => Number.isFinite(contributionCount))).toBe(true);
    expect(towers.some(({ h }) => h === MAX_LOG_HEIGHT)).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it('preserves fixed grid spacing constants so browser SVG layout trees stay finite', () => {
    const visibleCells = Array.from({ length: 14 * 7 }, (_, index) => {
      const week = Math.floor(index / 7);
      const day = index % 7;
      return { week, day, ...projectIsometric(week, day) };
    });

    const horizontalStep = projectIsometric(1, 0).x - projectIsometric(0, 0).x;
    const verticalStep = projectIsometric(1, 0).y - projectIsometric(0, 0).y;
    const bounds = visibleCells.reduce(
      (acc, cell) => ({
        minX: Math.min(acc.minX, cell.x),
        maxX: Math.max(acc.maxX, cell.x),
        minY: Math.min(acc.minY, cell.y),
        maxY: Math.max(acc.maxY, cell.y),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    expect(horizontalStep).toBe(TILE_WIDTH_HALF);
    expect(verticalStep).toBe(TILE_HEIGHT_HALF);
    expect(LOG_SCALE_MULTIPLIER).toBeGreaterThan(LINEAR_SCALE_MULTIPLIER);
    expect(Object.values(bounds).every(Number.isFinite)).toBe(true);
    expect(bounds.maxX - bounds.minX).toBe((13 + 6) * TILE_WIDTH_HALF);
    expect(bounds.maxY - bounds.minY).toBe((13 + 6) * TILE_HEIGHT_HALF);
  });
});
