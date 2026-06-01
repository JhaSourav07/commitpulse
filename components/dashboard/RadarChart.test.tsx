/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RadarChart from './RadarChart';
import '@testing-library/jest-dom/vitest';

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

describe('RadarChart', () => {
  const mockLangsA = [
    { name: 'TypeScript', percentage: 70, color: '#3178c6' },
    { name: 'Python', percentage: 30, color: '#3572A5' },
  ];

  const mockLangsB = [
    { name: 'TypeScript', percentage: 50, color: '#3178c6' },
    { name: 'JavaScript', percentage: 50, color: '#f1e05a' },
  ];

  it('renders title, labels, and language axis names', () => {
    render(
      <RadarChart languagesA={mockLangsA} languagesB={mockLangsB} labelA="User A" labelB="User B" />
    );

    expect(screen.getByText('Language Dominance')).toBeInTheDocument();
    expect(screen.getByText('User A')).toBeInTheDocument();
    expect(screen.getByText('User B')).toBeInTheDocument();

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
  });

  it('handles empty input arrays cleanly using pad languages', () => {
    render(<RadarChart languagesA={[]} languagesB={[]} labelA="User A" labelB="User B" />);

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
  });

  it('verify at least 3 axes are always shown via padding when fewer are provided', () => {
    const singleLang = [{ name: 'TypeScript', percentage: 100, color: '#3178c6' }];

    render(
      <RadarChart languagesA={singleLang} languagesB={singleLang} labelA="User A" labelB="User B" />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
  });

  it('deduplicates shared languages so TypeScript appears as a single axis label', () => {
    const langsA = [{ name: 'TypeScript', percentage: 70, color: '#3178c6' }];
    const langsB = [{ name: 'TypeScript', percentage: 50, color: '#3178c6' }];

    render(<RadarChart languagesA={langsA} languagesB={langsB} labelA="User A" labelB="User B" />);

    // TypeScript should appear exactly once as an axis label (SVG <text>) and once
    // in the bottom stats table — 2 total, not 4 (which would indicate two separate axes)
    expect(screen.getAllByText('TypeScript')).toHaveLength(2);
  });

  it('scales axis points dynamically based on max score in data', () => {
    const highScoreLangs = [
      { name: 'TypeScript', percentage: 100, color: '#3178c6' },
      { name: 'Python', percentage: 80, color: '#3572A5' },
      { name: 'JavaScript', percentage: 60, color: '#f1e05a' },
    ];

    const lowScoreLangs = [
      { name: 'TypeScript', percentage: 10, color: '#3178c6' },
      { name: 'Python', percentage: 5, color: '#3572A5' },
      { name: 'JavaScript', percentage: 2, color: '#f1e05a' },
    ];

    const { container } = render(
      <RadarChart
        languagesA={highScoreLangs}
        languagesB={lowScoreLangs}
        labelA="High Scorer"
        labelB="Low Scorer"
      />
    );

    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();

    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText('10%')).toBeDefined();

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('check generation of different polygon coordinates for different score magnitudes', () => {
    const highScores = [
      { name: 'TypeScript', percentage: 100, color: '#3178c6' },
      { name: 'Python', percentage: 100, color: '#3572A5' },
      { name: 'JavaScript', percentage: 100, color: '#f1e05a' },
    ];
    const lowScores = [
      { name: 'TypeScript', percentage: 10, color: '#3178c6' },
      { name: 'Python', percentage: 10, color: '#3572A5' },
      { name: 'JavaScript', percentage: 10, color: '#f1e05a' },
    ];

    const { container } = render(
      <RadarChart languagesA={highScores} languagesB={lowScores} labelA="High" labelB="Low" />
    );

    // 4 grid rings + 2 data polygons
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThanOrEqual(6);

    const CX = 160,
      CY = 160;
    const distanceOf = (c: Element) =>
      Math.hypot(
        parseFloat(c.getAttribute('cx') ?? '0') - CX,
        parseFloat(c.getAttribute('cy') ?? '0') - CY
      );

    const circles = Array.from(container.querySelectorAll('circle'));
    expect(circles).toHaveLength(6); // all pct > 0, 3 per user

    const avgHigh = circles.slice(0, 3).reduce((s, c) => s + distanceOf(c), 0) / 3;
    const avgLow = circles.slice(3, 6).reduce((s, c) => s + distanceOf(c), 0) / 3;

    expect(avgHigh).toBeGreaterThan(avgLow);
  });

  describe('responsive rendering', () => {
    it.each([320, 768, 1280])(
      'checks rendering of chart structure at viewport width %i',
      (width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { container, unmount } = render(
          <RadarChart
            languagesA={mockLangsA}
            languagesB={mockLangsB}
            labelA="User A"
            labelB="User B"
          />
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(screen.getByText('Language Dominance')).toBeInTheDocument();

        unmount();
      }
    );
  });
});
