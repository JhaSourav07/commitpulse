import { describe, it, expect } from 'vitest';
import { activityToTowers, generateMonolithSTL } from './export3d';
import type { ActivityData } from '@/types/dashboard';

/**
 * Factory that produces a chronologically ordered ActivityData[] of the requested
 * length. The countFactory lets each test shape its own contribution distribution
 * (uniform, gradient, extreme, etc.) without re-implementing date math.
 */
const makeActivity = (days: number, countFactory: (index: number) => number): ActivityData[] => {
  return Array.from({ length: days }, (_, index) => {
    // Start from 2024-01-01 and step forward day-by-day so every entry has a
    // unique, valid ISO date string. Using UTC avoids any local-timezone drift
    // that could cause two indices to collide on the same calendar day.
    const date = new Date(Date.UTC(2024, 0, 1) + index * 86_400_000).toISOString().slice(0, 10);

    const count = countFactory(index);
    const intensity: 0 | 1 | 2 | 3 | 4 = count === 0 ? 0 : 4;

    return { date, count, intensity };
  });
};

describe('export3d massive scaling', () => {
  it('produces one tower per activity entry for thousands of days without losing data', () => {
    // 5000 days simulates several years of dense contributor history. We assert
    // exact length so a future regression that silently truncates input is caught.
    const activity = makeActivity(5000, (index) => index + 1);

    const towers = activityToTowers(activity);

    expect(towers).toHaveLength(5000);
    expect(towers[0].date).toBe('2024-01-01');
    expect(towers.at(-1)?.contributionCount).toBe(5000);
  });

  it('keeps grid positions unique so massive datasets never produce overlapping towers', () => {
    // If the column/row math ever breaks at scale, two towers would share the
    // same (row, col) pair and overlap visually in the 3D print.
    const activity = makeActivity(2100, (index) => index + 1);

    const towers = activityToTowers(activity);
    const positionKeys = new Set(towers.map((tower) => `${tower.row}:${tower.col}`));

    expect(positionKeys.size).toBe(towers.length);
    towers.forEach((tower) => {
      expect(Number.isFinite(tower.x)).toBe(true);
      expect(Number.isFinite(tower.y)).toBe(true);
      expect(Number.isFinite(tower.h)).toBe(true);
      expect(tower.row).toBeGreaterThanOrEqual(0);
      expect(tower.row).toBeLessThanOrEqual(6);
    });
  });

  it('clamps tower heights to MAX_HEIGHT_MM when contribution counts are extreme', () => {
    // Number.MAX_SAFE_INTEGER guarantees the linear scale would overflow the
    // 30mm ceiling if clamping logic ever regresses.
    const activity = makeActivity(365, () => Number.MAX_SAFE_INTEGER);

    const towers = activityToTowers(activity);

    towers.forEach((tower) => {
      expect(tower.h).toBeLessThanOrEqual(30);
      expect(tower.h).toBeGreaterThanOrEqual(1);
      expect(tower.intensityLevel).toBe(4);
      expect(tower.hasCommits).toBe(true);
    });
  });

  it('generates a structurally valid STL string from a massive tower set', () => {
    // Pipes a large dataset through the full pipeline (activity -> towers -> STL)
    // to guarantee both functions cooperate at scale without producing malformed
    // facets that would crash a 3D slicer.
    const activity = makeActivity(1000, (index) => (index % 10) + 1);
    const towers = activityToTowers(activity);

    const stl = generateMonolithSTL(towers);

    expect(stl.startsWith('solid commitpulse_monolith')).toBe(true);
    expect(stl.trimEnd().endsWith('endsolid commitpulse_monolith')).toBe(true);

    const facetCount = (stl.match(/facet normal/g) ?? []).length;
    const endFacetCount = (stl.match(/endfacet/g) ?? []).length;
    const outerLoopCount = (stl.match(/outer loop/g) ?? []).length;
    const endLoopCount = (stl.match(/endloop/g) ?? []).length;

    expect(facetCount).toBe(endFacetCount);
    expect(outerLoopCount).toBe(endLoopCount);
    expect(facetCount).toBeGreaterThan(0);
  });

  it('completes the activity-to-STL pipeline within a safe performance margin for huge inputs', () => {
    // Combined throughput test: 3000 active days plus full STL serialization.
    // The threshold is deliberately generous (2000ms) so it stays stable across
    // slower CI runners without masking pathological regressions.
    const activity = makeActivity(3000, (index) => (index % 50) + 1);

    const startedAt = performance.now();
    const towers = activityToTowers(activity);
    const stl = generateMonolithSTL(towers);
    const duration = performance.now() - startedAt;

    expect(towers).toHaveLength(3000);
    expect(stl.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000);
  });
  it('handles edge variants safely: undefined activity, zero-only days, and missing intensity', () => {
    // Branch 1: undefined input must short-circuit to an empty array, not crash.
    // This guards the `!activity` half of the guard clause that the empty-array
    // test alone cannot reach.
    // @ts-expect-error – intentionally passing an invalid value to exercise the runtime guard
    expect(activityToTowers(undefined)).toEqual([]);

    // Branch 2: a huge dataset where every day has zero contributions must still
    // produce towers with h === 0 and intensityLevel === 0, and the downstream
    // STL must skip every tower body while still emitting the base plate.
    const zeroActivity: ActivityData[] = makeActivity(500, () => 0);
    const zeroTowers = activityToTowers(zeroActivity);

    zeroTowers.forEach((tower) => {
      expect(tower.h).toBe(0);
      expect(tower.intensityLevel).toBe(0);
      expect(tower.hasCommits).toBe(false);
    });

    const zeroStl = generateMonolithSTL(zeroTowers);
    // Base plate only = 12 facets (6 faces * 2 triangles). No tower bodies should
    // be emitted because the renderer must skip h <= 0 entries.
    const zeroFacetCount = (zeroStl.match(/facet normal/g) ?? []).length;
    expect(zeroFacetCount).toBe(12);

    // Branch 3: when ActivityData omits the `intensity` field, the fallback
    // ceiling-based formula must compute an intensityLevel in the 1..4 range.
    const noIntensityActivity: ActivityData[] = Array.from({ length: 50 }, (_, index) => ({
      date: new Date(Date.UTC(2024, 0, 1) + index * 86_400_000).toISOString().slice(0, 10),
      count: index + 1,
    })) as ActivityData[];

    const fallbackTowers = activityToTowers(noIntensityActivity);
    fallbackTowers.forEach((tower) => {
      expect(tower.intensityLevel).toBeGreaterThanOrEqual(1);
      expect(tower.intensityLevel).toBeLessThanOrEqual(4);
    });
  });
});
