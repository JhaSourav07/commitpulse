import { describe, it, expect } from 'vitest';
import { generateMonolithSTL, activityToTowers } from './export3d';
import type { TowerData } from './svg/layout';
import type { ActivityData } from '@/types/dashboard';

describe('generateMonolithSTL', () => {
  it('generates a valid STL string from tower data', () => {
    // Mock a couple of towers (one with height, one ghost)
    const mockTowers: TowerData[] = [
      {
        x: 0,
        y: 0,
        h: 10,
        hasCommits: true,
        isGhost: false,
        isToday: false,
        isTodayWithCommits: false,
        tooltip: '',
        date: '',
        contributionCount: 5,
        faceOpacity: { left: 1, right: 1, top: 1 },
        strokeOpacity: 1,
        strokeWidth: 1,
        row: 0,
        col: 0,
        intensityLevel: 2,
      },
      {
        x: 0,
        y: 0,
        h: 0,
        hasCommits: false,
        isGhost: true,
        isToday: false,
        isTodayWithCommits: false,
        tooltip: '',
        date: '',
        contributionCount: 0,
        faceOpacity: { left: 1, right: 1, top: 1 },
        strokeOpacity: 1,
        strokeWidth: 1,
        row: 1,
        col: 1,
        intensityLevel: 0,
      },
    ];

    const stl = generateMonolithSTL(mockTowers);

    // Assert the basic structure of an STL file is present
    expect(stl).toContain('solid commitpulse_monolith');
    expect(stl).toContain('facet normal');
    expect(stl).toContain('vertex');
    expect(stl).toContain('endsolid commitpulse_monolith');
  });
});

it('generates structurally valid ASCII STL facets', () => {
  const mockTowers: TowerData[] = [
    {
      x: 0,
      y: 0,
      h: 10,
      hasCommits: true,
      isGhost: false,
      isToday: false,
      isTodayWithCommits: false,
      tooltip: '',
      date: '',
      contributionCount: 5,
      faceOpacity: { left: 1, right: 1, top: 1 },
      strokeOpacity: 1,
      strokeWidth: 1,
      row: 0,
      col: 0,
      intensityLevel: 2,
    },
  ];

  const stl = generateMonolithSTL(mockTowers);

  const facetCount = (stl.match(/facet normal/g) ?? []).length;
  const endFacetCount = (stl.match(/endfacet/g) ?? []).length;

  const outerLoopCount = (stl.match(/outer loop/g) ?? []).length;
  const endLoopCount = (stl.match(/endloop/g) ?? []).length;

  expect(facetCount).toBe(endFacetCount);
  expect(outerLoopCount).toBe(endLoopCount);

  const vertexLines = stl.split('\n').filter((line) => line.trim().startsWith('vertex'));

  expect(vertexLines.length).toBeGreaterThan(0);

  vertexLines.forEach((line) => {
    expect(line.trim()).toMatch(/^vertex -?\d+\.\d+ -?\d+\.\d+ -?\d+\.\d+$/);
  });
});

it('always includes a base plate even with no tower data', () => {
  const stl = generateMonolithSTL([]);

  expect(stl).toContain('solid commitpulse_monolith');
  expect(stl).toContain('endsolid commitpulse_monolith');
  expect(stl).toContain('facet normal');
});
it('skips ghost towers (h=0) while still generating the base plate', () => {
  const ghostTowers: TowerData[] = [
    {
      x: 0,
      y: 0,
      h: 0,
      hasCommits: false,
      isGhost: true,
      isToday: false,
      isTodayWithCommits: false,
      tooltip: '',
      date: '',
      contributionCount: 0,
      faceOpacity: { left: 1, right: 1, top: 1 },
      strokeOpacity: 1,
      strokeWidth: 1,
      row: 0,
      col: 0,
      intensityLevel: 0,
    },
  ];

  const stl = generateMonolithSTL(ghostTowers);

  expect(stl).toContain('solid commitpulse_monolith');
  expect(stl).toContain('endsolid commitpulse_monolith');

  const facetCount = (stl.match(/facet normal/g) ?? []).length;

  // Base plate only = 12 facets
  expect(facetCount).toBe(12);
});

// ─── activityToTowers ────────────────────────────────────────────────────────

describe('activityToTowers', () => {
  const makeDay = (
    date: string,
    count: number,
    intensity: 0 | 1 | 2 | 3 | 4 = 0
  ): ActivityData => ({
    date,
    count,
    intensity: count === 0 ? 0 : intensity || (Math.ceil((count / 10) * 4) as 0 | 1 | 2 | 3 | 4),
  });

  it('returns an empty array when activity is empty', () => {
    expect(activityToTowers([])).toEqual([]);
  });

  it('returns an empty array when activity is undefined/null', () => {
    // @ts-expect-error – testing runtime behaviour when undefined is passed
    expect(activityToTowers(undefined)).toEqual([]);
    // @ts-expect-error – testing runtime behaviour when null is passed
    expect(activityToTowers(null)).toEqual([]);
  });

  it('assigns row/col positions in chronological column-major order', () => {
    // 8 days → col 0 has rows 0-6 (7 days), col 1 has row 0 (1 day)
    const days = Array.from({ length: 8 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, i + 1)
    );
    const towers = activityToTowers(days);

    expect(towers[0]).toMatchObject({ row: 0, col: 0 });
    expect(towers[6]).toMatchObject({ row: 6, col: 0 });
    expect(towers[7]).toMatchObject({ row: 0, col: 1 });
  });

  it('sets h=0 for days with no contributions', () => {
    const days = [makeDay('2024-01-01', 0), makeDay('2024-01-02', 5)];
    const towers = activityToTowers(days);

    expect(towers[0].h).toBe(0);
    expect(towers[0].hasCommits).toBe(false);
  });

  it('sets h >= 1 for any day with at least one contribution', () => {
    const days = [makeDay('2024-01-01', 1)];
    const towers = activityToTowers(days);

    expect(towers[0].h).toBeGreaterThanOrEqual(1);
    expect(towers[0].hasCommits).toBe(true);
  });

  it('scales the tallest day to MAX_HEIGHT_MM (30mm)', () => {
    const days = [
      makeDay('2024-01-01', 10), // max
      makeDay('2024-01-02', 5),
    ];
    const towers = activityToTowers(days);
    // The day with count === maxCount should get the full 30mm
    expect(towers[0].h).toBe(30);
  });

  it('produces a valid STL when piped through generateMonolithSTL', () => {
    const days = Array.from({ length: 14 }, (_, i) =>
      makeDay(`2024-01-${String(i + 1).padStart(2, '0')}`, i % 5)
    );
    const towers = activityToTowers(days);
    const stl = generateMonolithSTL(towers);

    expect(stl).toContain('solid commitpulse_monolith');
    expect(stl).toContain('endsolid commitpulse_monolith');
    expect(stl).toContain('facet normal');
    expect(stl).toContain('vertex');

    // Every facet must be closed
    const facetCount = (stl.match(/facet normal/g) ?? []).length;
    const endFacetCount = (stl.match(/endfacet/g) ?? []).length;
    expect(facetCount).toBe(endFacetCount);
  });

  it('keeps dates sorted chronologically regardless of input order', () => {
    const days = [makeDay('2024-01-03', 3), makeDay('2024-01-01', 1), makeDay('2024-01-02', 2)];
    const towers = activityToTowers(days);
    // After sorting: 01 → col 0 row 0, 02 → col 0 row 1, 03 → col 0 row 2
    expect(towers[0].tooltip).toContain('2024-01-01');
    expect(towers[1].tooltip).toContain('2024-01-02');
    expect(towers[2].tooltip).toContain('2024-01-03');
  });
});
