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
        contributionCount: 5,
        faceOpacity: { left: 1, right: 1, top: 1 },
        strokeOpacity: 1,
        strokeWidth: 1,
        row: 0,
        col: 0,
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
        contributionCount: 0,
        faceOpacity: { left: 1, right: 1, top: 1 },
        strokeOpacity: 1,
        strokeWidth: 1,
        row: 1,
        col: 1,
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
