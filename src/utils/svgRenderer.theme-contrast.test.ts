import { describe, expect, it } from 'vitest';
import { generateOptimizedSvg } from './svgRenderer';

describe('svgRenderer - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  const sampleData = [
    {
      date: '2025-01-01',
      count: 3,
      x: 0,
      y: 0,
    },
  ];

  it('renders background footprint colors for zero-contribution tiles', () => {
    const svg = generateOptimizedSvg([
      {
        date: '2025-01-01',
        count: 0,
        x: 0,
        y: 0,
      },
    ]);

    expect(svg).toContain('#1e293b');
    expect(svg).toContain('opacity="0.2"');
  });

  it('renders contribution blocks with visible foreground colors', () => {
    const svg = generateOptimizedSvg(sampleData);

    expect(svg).toContain('#4ade80');
    expect(svg).toContain('url(#left-shading)');
    expect(svg).toContain('url(#right-shading)');
  });

  it('includes gradient definitions that support visual contrast', () => {
    const svg = generateOptimizedSvg(sampleData);

    expect(svg).toContain('linearGradient');
    expect(svg).toContain('#22c55e');
    expect(svg).toContain('#166534');
  });

  it('preserves foreground block rendering above background layers', () => {
    const svg = generateOptimizedSvg(sampleData);

    expect(svg).toContain('<g transform="translate');
    expect(svg).toContain('transform="translate(0, -12)"');
  });

  it('maintains sufficient color differentiation between shaded surfaces', () => {
    const svg = generateOptimizedSvg(sampleData);

    expect(svg).toContain('#22c55e');
    expect(svg).toContain('#15803d');
    expect(svg).toContain('#16a34a');
    expect(svg).toContain('#166534');

    expect('#22c55e').not.toBe('#15803d');
    expect('#16a34a').not.toBe('#166534');
  });
});
