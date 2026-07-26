import { describe, expect, it } from 'vitest';
import { computeTowers, projectIsometric } from './layout';

const makeCalendar = (weeksCount: number, countFactory: (week: number, day: number) => number) => {
  const weeks = Array.from({ length: weeksCount }, (_, weekIndex) => ({
    contributionDays: Array.from({ length: 7 }, (_, dayIndex) => {
      const dayNumber = weekIndex * 7 + dayIndex + 1;

      return {
        date: new Date(Date.UTC(2026, 0, dayNumber)).toISOString().slice(0, 10),
        contributionCount: countFactory(weekIndex, dayIndex),
      };
    }),
  }));

  return {
    totalContributions: weeks.reduce(
      (total, week) =>
        total + week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
      0
    ),
    weeks,
  };
};

describe('layout massive scaling', () => {
  it('limits rendering to the latest fourteen weeks for massive calendars', () => {
    const calendar = makeCalendar(1000, (week, day) => week + day + 1);

    const towers = computeTowers(calendar);

    expect(towers).toHaveLength(98);
    expect(towers[0].row).toBe(0);
    expect(towers.at(-1)?.row).toBe(13);
  });

  it('keeps projected coordinates finite and unique for dense visible grids', () => {
    const calendar = makeCalendar(250, (week, day) => (week + 1) * (day + 1));

    const towers = computeTowers(calendar);
    const coordinateKeys = new Set(towers.map((tower) => `${tower.x}:${tower.y}`));

    expect(coordinateKeys.size).toBe(towers.length);

    towers.forEach((tower) => {
      expect(Number.isFinite(tower.x)).toBe(true);
      expect(Number.isFinite(tower.y)).toBe(true);
      expect(Number.isFinite(tower.h)).toBe(true);
      expect(tower.x).toBe(projectIsometric(tower.row, tower.col).x);
      expect(tower.y).toBe(projectIsometric(tower.row, tower.col).y);
    });
  });

  it('caps tower heights for extreme high contribution counts', () => {
    const calendar = makeCalendar(52, () => Number.MAX_SAFE_INTEGER);

    const linearTowers = computeTowers(calendar, 'linear');
    const logTowers = computeTowers(calendar, 'log');

    linearTowers.forEach((tower) => {
      expect(tower.h).toBeLessThanOrEqual(60);
      expect(tower.intensityLevel).toBe(4);
      expect(tower.hasCommits).toBe(true);
    });

    logTowers.forEach((tower) => {
      expect(tower.h).toBeLessThanOrEqual(80);
      expect(tower.intensityLevel).toBe(4);
      expect(tower.hasCommits).toBe(true);
    });
  });

  it('scales LoC mode safely for large addition and deletion values', () => {
    const calendar = {
      totalContributions: 0,
      weeks: Array.from({ length: 120 }, (_, weekIndex) => ({
        contributionDays: Array.from({ length: 7 }, (_, dayIndex) => {
          const dayNumber = weekIndex * 7 + dayIndex + 1;

          return {
            date: new Date(Date.UTC(2026, 0, dayNumber)).toISOString().slice(0, 10),
            contributionCount: 1,
            locAdditions: 100_000 + weekIndex,
            locDeletions: 50_000 + dayIndex,
          };
        }),
      })),
    };

    const towers = computeTowers(calendar, 'log', '', 'loc');

    expect(towers).toHaveLength(98);

    towers.forEach((tower) => {
      expect(tower.contributionCount).toBeGreaterThan(100_000);
      expect(tower.tooltip).toContain('est. lines of code');
      expect(tower.h).toBeLessThanOrEqual(80);
      expect(Number.isFinite(tower.h)).toBe(true);
    });
  });

  it('computes massive layouts within a safe performance margin', () => {
    const calendar = makeCalendar(5000, (week, day) => (week + 1) * (day + 1));
    const startedAt = performance.now();

    const towers = computeTowers(calendar, 'log');

    const duration = performance.now() - startedAt;

    expect(towers).toHaveLength(98);
    expect(duration).toBeLessThan(100);
  });
});
