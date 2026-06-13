import { describe, it, expect } from 'vitest';
import { generateOptimizedSvg, ContributionNode } from './svgRenderer';

const mockData: ContributionNode[] = [
  { date: '2026-01-01', count: 0, x: 0, y: 0 },
  { date: '2026-01-02', count: 5, x: 0, y: 1 },
  { date: '2026-01-03', count: 12, x: 1, y: 1 },
];

describe('generateOptimizedSvg — Accessibility', () => {
  it('includes role="img" on the root svg element', () => {
    const svg = generateOptimizedSvg(mockData);
    expect(svg).toContain('role="img"');
  });

  it('includes a <title> element for screen readers', () => {
    const svg = generateOptimizedSvg(mockData);
    expect(svg).toMatch(/<title id="svg-title">/);
  });

  it('includes a <desc> element describing the chart', () => {
    const svg = generateOptimizedSvg(mockData);
    expect(svg).toMatch(/<desc id="svg-desc">/);
  });

  it('includes aria-labelledby referencing title and desc', () => {
    const svg = generateOptimizedSvg(mockData);
    expect(svg).toContain('aria-labelledby="svg-title svg-desc"');
  });
});
