import { describe, it, expect } from 'vitest';
import { generateMonolithSTL } from './export3d';
import type { TowerData } from './svg/layout';

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
