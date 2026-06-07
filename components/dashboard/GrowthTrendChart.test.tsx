/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GrowthTrendChart from './GrowthTrendChart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.whileInView;
      delete props.viewport;
      delete props.transition;

      return (
        <div className={className} style={style} {...props}>
          {children}
        </div>
      );
    },
    path: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;

      return (
        <path className={className} style={style} {...props}>
          {children}
        </path>
      );
    },
  },
}));

describe('GrowthTrendChart', () => {
  const activityA = [
    { date: '2026-05-01', count: 10 },
    { date: '2026-05-02', count: 5 },
  ];

  const activityB = [
    { date: '2026-05-01', count: 8 },
    { date: '2026-05-02', count: 12 },
  ];

  it('renders title, labels, and battle timeline sections', () => {
    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getByText('Contribution Growth Trend')).toBeDefined();
    expect(screen.getByText('User A')).toBeDefined();
    expect(screen.getByText('User B')).toBeDefined();
    expect(screen.getByText('⚔️ Commit Battle Timeline')).toBeDefined();
  });

  it('aggregates daily activity counts into monthly counts correctly', () => {
    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    // May 2026 should show +5 for User B winner (Total A = 15, Total B = 20)
    expect(screen.getByText('+5')).toBeDefined();
  });

  // =========================================================================
  // ISSUE OBJECTIVE: Verify SVG and Path Rendering
  // =========================================================================
  it('renders SVG chart with area and stroke paths', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    // 1. Assert an <svg> element is in the DOM
    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toBeNull();

    // 2. Assert at least 2 <path> elements are present (one per user)
    const pathElements = container.querySelectorAll('path');
    expect(pathElements.length).toBeGreaterThanOrEqual(2);
  });

  // =========================================================================
  // ISSUE #1528: Verify responsive rendering and gradient elements
  // =========================================================================
  it('renders gradient definitions for area fills', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const defs = container.querySelector('defs');
    expect(defs).not.toBeNull();

    const gradientA = container.querySelector('linearGradient[id$="-gradient-area-a"]');
    const gradientB = container.querySelector('linearGradient[id$="-gradient-area-b"]');
    expect(gradientA).not.toBeNull();
    expect(gradientB).not.toBeNull();
    expect(gradientA?.tagName).toBe('linearGradient');
    expect(gradientB?.tagName).toBe('linearGradient');
  });

  it('renders glow filter definitions for line strokes', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const glowA = container.querySelector('filter[id$="-glow-line-a"]');
    const glowB = container.querySelector('filter[id$="-glow-line-b"]');
    expect(glowA).not.toBeNull();
    expect(glowB).not.toBeNull();
    expect(glowA?.tagName).toBe('filter');
    expect(glowB?.tagName).toBe('filter');
  });

  it('renders grid lines for chart orientation', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const gridLines = container.querySelectorAll('line');
    expect(gridLines.length).toBeGreaterThanOrEqual(4);
  });

  it('renders Y-axis labels for value reference', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const yLabels = container.querySelectorAll('text[text-anchor="end"]');
    expect(yLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders X-axis month labels at regular intervals', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const xLabels = container.querySelectorAll('text[text-anchor="middle"]');
    expect(xLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('uses viewBox for responsive scaling', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toBeNull();
    expect(svgElement?.getAttribute('viewBox')).toBe('0 0 500 180');
    expect(svgElement?.getAttribute('class')).toContain('w-full');
  });

  it('renders reduced month labels to avoid overlap on small screens', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const monthLabels = container.querySelectorAll('text[text-anchor="middle"]');
    expect(monthLabels.length).toBeLessThanOrEqual(7);
    expect(monthLabels.length).toBeGreaterThan(0);
  });

  it('handles empty activity data gracefully without crashing', () => {
    const { container } = render(
      <GrowthTrendChart activityA={[]} activityB={[]} labelA="User A" labelB="User B" />
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toBeNull();
  });
  it('renders path coordinates for responsive scaling', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const paths = container.querySelectorAll('path');

    expect(paths.length).toBeGreaterThan(0);

    paths.forEach((path) => {
      const d = path.getAttribute('d');

      if (d) {
        expect(d.length).toBeGreaterThan(0);
        expect(d).toMatch(/[MLCQ]/);
      }
    });
  });
  it('renders gradient stop elements for area fills', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const gradientA = container.querySelector('linearGradient[id$="-gradient-area-a"]');

    const gradientB = container.querySelector('linearGradient[id$="-gradient-area-b"]');

    expect(gradientA?.querySelectorAll('stop').length).toBeGreaterThan(0);
    expect(gradientB?.querySelectorAll('stop').length).toBeGreaterThan(0);
  });

  it('handles single data point without crashing', () => {
    const { container } = render(
      <GrowthTrendChart
        activityA={[{ date: '2026-05-01', count: 5 }]}
        activityB={[{ date: '2026-05-02', count: 3 }]}
        labelA="User A"
        labelB="User B"
      />
    );

    const svgElement = container.querySelector('svg');
    expect(svgElement).not.toBeNull();
  });
});
