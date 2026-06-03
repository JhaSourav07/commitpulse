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

  it('renders chart elements and layout structure visible across viewport sizes', () => {
    const mockLangsA = [
      { name: 'TypeScript', percentage: 80, color: '#3178c6' },
      { name: 'Python', percentage: 60, color: '#3572A5' },
      { name: 'JavaScript', percentage: 40, color: '#f1e05a' },
    ];

    const mockLangsB = [
      { name: 'TypeScript', percentage: 50, color: '#3178c6' },
      { name: 'Python', percentage: 70, color: '#3572A5' },
      { name: 'JavaScript', percentage: 30, color: '#f1e05a' },
    ];

    const { container } = render(
      <RadarChart languagesA={mockLangsA} languagesB={mockLangsB} labelA="User A" labelB="User B" />
    );

    // Check that SVG element is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();

    // Check that grid polygons are rendered (concentric levels)
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);

    // Check that axis lines are rendered
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);

    // Check that axis labels are rendered
    expect(screen.getAllByText('TypeScript')).toBeDefined();
    expect(screen.getAllByText('Python')).toBeDefined();
    expect(screen.getAllByText('JavaScript')).toBeDefined();

    // Check that data points (circles) are rendered
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
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

    // Check that data points (circles) are rendered
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('dynamically scales axis points based on dataset max score', () => {
    // Mock dataset with specific maximum score
    const mockLangsA = [
      { name: 'TypeScript', percentage: 100, color: '#3178c6' }, // Max score
      { name: 'Python', percentage: 75, color: '#3572A5' },
      { name: 'JavaScript', percentage: 50, color: '#f1e05a' },
    ];

    const mockLangsB = [
      { name: 'TypeScript', percentage: 90, color: '#3178c6' },
      { name: 'Python', percentage: 60, color: '#3572A5' },
      { name: 'JavaScript', percentage: 30, color: '#f1e05a' },
    ];

    const { container } = render(
      <RadarChart languagesA={mockLangsA} languagesB={mockLangsB} labelA="User A" labelB="User B" />
    );

    // Verify that polygons are rendered with points attribute
    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);

    // Check that the data polygons have points attribute (indicating scaling)
    const dataPolygons = Array.from(polygons).filter((p) =>
      p.getAttribute('points')?.includes(',')
    );
    expect(dataPolygons.length).toBeGreaterThan(0);

    // Verify that circles (data points) are rendered at different positions
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);

    // Get all circle positions to verify they're scaled differently
    const circlePositions = Array.from(circles).map((circle) => ({
      cx: circle.getAttribute('cx'),
      cy: circle.getAttribute('cy'),
    }));

    // Verify that not all circles are at the same position (indicating dynamic scaling)
    const uniquePositions = new Set(circlePositions.map((pos) => `${pos.cx},${pos.cy}`));
    expect(uniquePositions.size).toBeGreaterThan(1);
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

  describe('RadarChart Responsive Rendering', () => {
    // These tests verify that the chart renders correctly across different viewport sizes.
    // The scaling logic uses a fixed SVG size (320x300) with a center point at (160, 160)
    // and a maximum radius of 90px. The getCoordinates function dynamically calculates
    // point positions based on the percentage value, ensuring the chart scales properly
    // regardless of the viewport width.

    it('renders correctly on mobile viewports (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = render(
        <RadarChart
          languagesA={mockLangsA}
          languagesB={mockLangsB}
          labelA="User A"
          labelB="User B"
        />
      );

      // Verify SVG container exists with correct dimensions
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '320');
      expect(svg).toHaveAttribute('height', '300');

      // Verify title and labels are present
      expect(screen.getByText('Language Dominance')).toBeInTheDocument();
      expect(screen.getByText('User A')).toBeInTheDocument();
      expect(screen.getByText('User B')).toBeInTheDocument();

      // Verify grid polygons are rendered (4 concentric rings)
      const gridPolygons = container.querySelectorAll('polygon[fill="none"]');
      expect(gridPolygons.length).toBe(4);

      // Verify axis lines are present
      const axisLines = container.querySelectorAll('line[stroke-dasharray="2,2"]');
      expect(axisLines.length).toBeGreaterThan(0);

      // Verify all polygons (4 background grid layers + 2 user data layers)
      const polygons = container.querySelectorAll('polygon');
      expect(polygons.length).toBe(6);
    });

    it('renders correctly on tablet viewports (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(
        <RadarChart
          languagesA={mockLangsA}
          languagesB={mockLangsB}
          labelA="User A"
          labelB="User B"
        />
      );

      // Verify SVG structure remains intact
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Language Dominance')).toBeInTheDocument();

      // Verify all language labels are rendered
      expect(screen.getAllByText('TypeScript')).toBeDefined();
      expect(screen.getAllByText('Python')).toBeDefined();
      expect(screen.getAllByText('JavaScript')).toBeDefined();

      // Verify legend elements are present
      const legendItems = container.querySelectorAll('.flex.items-center.gap-1\\.5');
      expect(legendItems.length).toBe(2);

      // Verify percentage display in stats table
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('renders correctly on desktop viewports (1280px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      const { container } = render(
        <RadarChart
          languagesA={mockLangsA}
          languagesB={mockLangsB}
          labelA="User A"
          labelB="User B"
        />
      );

      // Verify complete chart structure
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(screen.getByText('Language Dominance')).toBeInTheDocument();
      expect(screen.getByText('Radar Comparison')).toBeInTheDocument();

      // Verify glow filters are defined for visual effects
      // Verify glow filters are defined for visual effects
      const glowFilters = container.querySelectorAll('filter');
      expect(glowFilters.length).toBe(2);

      // Verify vertex dots are rendered for non-zero percentages
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Verify stats table structure
      const statsTable = container.querySelector('.grid.grid-cols-2');
      expect(statsTable).toBeInTheDocument();
    });
  });
});
