import { describe, it, expect } from 'vitest';
import { generateOptimizedSvg, ContributionNode } from '../svgRenderer';

describe('generateOptimizedSvg', () => {
  const mockData: ContributionNode[] = [
    { date: '2026-01-01', count: 0, x: 0, y: 0 },
    { date: '2026-01-02', count: 5, x: 0, y: 1 },
    { date: '2026-01-03', count: 12, x: 1, y: 1 },
  ];

  // Unit Test
  it('should cleanly generate a 3D isometric grid with defs and elements', () => {
    const result = generateOptimizedSvg(mockData);

    expect(result).toBeDefined();
    expect(result).toContain('<svg');
    expect(result).toContain('id="iso-top"');
    expect(result).toContain('id="monolith-grid"');
  });

  // Structural Logic Test
  it('should handle zero-count contributions by pruning block height layers', () => {
    const result = generateOptimizedSvg(mockData);
    expect(result).toContain('opacity="0.2"');
  });

  // Snapshot Test
  it('should match the optimized contribution graph SVG structure snapshot', () => {
    const result = generateOptimizedSvg(mockData);
    expect(result).toMatchSnapshot();
  });

  // Occlusion Culling Test
  it('should not incorrectly cull a background tile when a taller tower is in front of it', () => {
    const cullingTestData: ContributionNode[] = [
      { date: '2026-01-01', count: 1, x: 2, y: 2 }, // Background tile (should be kept)
      { date: '2026-01-02', count: 20, x: 3, y: 3 }, // Taller foreground tile
    ];

    const result = generateOptimizedSvg(cullingTestData);

    // Calculate the expected translation mapping for tile (2,2)
    // isoX = (2 - 2) * 8 = 0
    // isoY = (2 + 2) * 4 = 16
    expect(result).toContain('transform="translate(0, 16)"');
  });
});
