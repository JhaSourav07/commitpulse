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

    // No <circle> elements should exist because the empty state renders no chart vertices
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(0);
  });

  it('does not invent TypeScript/JavaScript/Python axes when there is no language data', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="Empty A" labelB="Empty B" />
    );

    // No fabricated language axis labels should appear
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.queryByText('JavaScript')).toBeNull();
    expect(screen.queryByText('Python')).toBeNull();

    // No axis lines are drawn for invented languages
    const axisLines = container.querySelectorAll('line[stroke-dasharray="2,2"]');
    expect(axisLines.length).toBe(0);

    // An explicit empty state is shown instead
    expect(screen.getByText('No language data to compare yet')).toBeInTheDocument();
  });

  it('renders the empty state without the chart SVG when there are no languages', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="A" labelB="B" />
    );

    // No radar SVG is drawn for empty data; the empty-state message replaces it
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText('No language data to compare yet')).toBeInTheDocument();

    // The header (title) still renders so the card stays informative
    expect(screen.getByText('Language Dominance')).toBeInTheDocument();
  });

  it('maintains container styling and legend, showing the empty state, when both inputs are empty', () => {
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

    // The chart stats table is replaced by the empty state
    expect(container.querySelector('.grid.grid-cols-2')).toBeNull();
    expect(screen.getByText('No language data to compare yet')).toBeInTheDocument();
  });
});
