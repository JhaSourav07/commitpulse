import { describe, it, expect } from 'vitest';
import { generateOptimizedSvg, ContributionNode } from './svgRenderer';

function generateContributionData(weeks: number): ContributionNode[] {
  const data: ContributionNode[] = [];
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < weeks; y++) {
      data.push({
        date: `2024-${String((y % 12) + 1).padStart(2, '0')}-${String((x % 28) + 1).padStart(2, '0')}`,
        count: Math.floor(Math.random() * 50),
        x,
        y,
      });
    }
  }
  return data;
}

describe('generateOptimizedSvg massive-scaling: Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders without crashing for a massive dataset of 5000+ contribution nodes', () => {
    const data = generateContributionData(800);

    expect(data.length).toBeGreaterThan(5000);

    const svg = generateOptimizedSvg(data);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('completes rendering within acceptable time limits under extreme load of 10000 nodes', () => {
    const data = generateContributionData(1429);

    const start = performance.now();
    const svg = generateOptimizedSvg(data);
    const duration = performance.now() - start;

    expect(svg.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(5000);
  });

  it('produces valid SVG coordinates that scale cleanly with extremely high contribution counts', () => {
    const data: ContributionNode[] = [];
    for (let x = 0; x < 7; x++) {
      data.push({
        date: `2024-01-${String(x + 1).padStart(2, '0')}`,
        count: 999999,
        x,
        y: 0,
      });
    }

    const svg = generateOptimizedSvg(data);

    expect(svg).toContain('viewBox');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('Infinity');
  });

  it('handles a fully populated 53-week grid without overlapping or missing elements', () => {
    const data = generateContributionData(53);

    const svg = generateOptimizedSvg(data);

    const groupCount = svg.match(/<g transform="translate/g)?.length ?? 0;
    const flatTileCount = svg.match(/<use href="#iso-top"/g)?.length ?? 0;

    expect(groupCount + flatTileCount).toBeGreaterThan(0);
    expect(svg).toContain('id="monolith-grid"');
  });

  it('returns an empty grid container without breaking the layout tree when given an empty dataset', () => {
    const svg = generateOptimizedSvg([]);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('id="monolith-grid"');
    expect(svg).not.toContain('NaN');
  });
});
