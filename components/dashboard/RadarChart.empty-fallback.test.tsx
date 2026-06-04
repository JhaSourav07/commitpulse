/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RadarChart from './RadarChart';
import '@testing-library/jest-dom/vitest';

// Mock framer-motion so animated elements render as plain SVG/HTML synchronously in jsdom
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
    polygon: ({ children, className, style, ...props }: any) => {
      delete props.initial;
      delete props.animate;
      delete props.transition;

      return (
        <polygon className={className} style={style} {...props}>
          {children}
        </polygon>
      );
    },
  },
}));

describe('RadarChart - Edge Cases & Empty/Missing Inputs (Variation 1)', () => {
  it('renders without throwing when both languagesA and languagesB are completely empty', () => {
    expect(() =>
      render(<RadarChart languagesA={[]} languagesB={[]} labelA="User A" labelB="User B" />)
    ).not.toThrow();

    // Title should still be visible — confirms component mounted cleanly
    expect(screen.getByText('Language Dominance')).toBeInTheDocument();
    expect(screen.getByText('Radar Comparison')).toBeInTheDocument();
  });

  it('does NOT render data vertex circles when all language percentages are missing/zero', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="User A" labelB="User B" />
    );

    // No <circle> elements should exist because every padded language has 0% (pct > 0 check fails)
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });

  it('falls back to padding languages (TypeScript, JavaScript, Python) to guarantee >= 3 axes', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="Empty A" labelB="Empty B" />
    );

    // All three pad languages must appear as axis labels in the SVG
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);

    // Exactly 3 axis lines (one per padded language) must be rendered
    const axisLines = container.querySelectorAll('line[stroke-dasharray="2,2"]');
    expect(axisLines.length).toBe(3);
  });

  it('keeps standard SVG layout structure intact (grid rings, filters, svg dimensions) with empty inputs', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="A" labelB="B" />
    );

    // SVG should be rendered with the fixed dimensions defined in the component
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '320');
    expect(svg).toHaveAttribute('height', '300');

    // 4 concentric grid polygons (levels: 25, 50, 75, 100) must always exist
    const gridPolygons = container.querySelectorAll('polygon[fill="none"]');
    expect(gridPolygons.length).toBe(4);

    // 2 glow filters (cyan + purple) must remain defined even with no data
    const filters = container.querySelectorAll('filter');
    expect(filters.length).toBe(2);
  });

  it('maintains container styling and legend even when both label sets are empty arrays', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="Solo A" labelB="Solo B" />
    );

    // Outer container retains its rounded/border/min-height layout classes
    const wrapper = container.querySelector('div.rounded-xl');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).toContain('min-h-[360px]');
    expect(wrapper?.className).toContain('border');

    // Legend labels still render so the empty state stays informative
    expect(screen.getByText('Solo A')).toBeInTheDocument();
    expect(screen.getByText('Solo B')).toBeInTheDocument();

    // Stats table at the bottom exists (grid-cols-2 layout marker)
    const statsTable = container.querySelector('.grid.grid-cols-2');
    expect(statsTable).toBeInTheDocument();
  });
});
