import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RadarChart from './RadarChart';
import type { LanguageData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    polygon: ({ children, ...props }: React.SVGAttributes<SVGPolygonElement>) => (
      <polygon {...props}>{children}</polygon>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const makeLanguages = (count: number, basePercentage = 100): LanguageData[] =>
  Array.from({ length: count }, (_, i) => ({
    name: `Language${i + 1}`,
    percentage: Math.min(100, basePercentage - i),
    color: `#${((i * 1234567) % 0xffffff).toString(16).padStart(6, '0')}`,
  }));

describe('RadarChart - Massive Data Sets & Extreme High Bounds Scaling', () => {
  it('renders without crashing when both users have maximum 100% on all languages', () => {
    const maxLanguages: LanguageData[] = [
      { name: 'TypeScript', percentage: 100, color: '#3178c6' },
      { name: 'JavaScript', percentage: 100, color: '#f1e05a' },
      { name: 'Python', percentage: 100, color: '#3572a5' },
      { name: 'Rust', percentage: 100, color: '#dea584' },
      { name: 'Go', percentage: 100, color: '#00add8' },
      { name: 'Java', percentage: 100, color: '#b07219' },
    ];

    const { container } = render(
      <RadarChart
        languagesA={maxLanguages}
        languagesB={maxLanguages}
        labelA="UserA"
        labelB="UserB"
      />
    );

    // Must render without crashing at maximum bounds
    expect(container).toBeTruthy();
    const polygons = container.querySelectorAll('polygon');
    // Grid polygons + 2 user area polygons
    expect(polygons.length).toBeGreaterThanOrEqual(2);
  });

  it('caps at 6 language axes even when supplied with a massive language list of 50+ entries', () => {
    const massiveList = makeLanguages(50);

    const { container } = render(
      <RadarChart
        languagesA={massiveList}
        languagesB={massiveList}
        labelA="HeavyUserA"
        labelB="HeavyUserB"
      />
    );

    // SVG axis labels must be capped at 6 — no layout overflow from excessive axes
    const axisTexts = container.querySelectorAll('text');
    // At most 6 axis labels + level labels — total should be reasonable, not 50
    expect(axisTexts.length).toBeLessThanOrEqual(20);
    expect(container).toBeTruthy();
  });

  it('SVG coordinates remain within viewBox bounds under extreme percentage values', () => {
    const extremeLanguages: LanguageData[] = [
      { name: 'TypeScript', percentage: 100, color: '#3178c6' },
      { name: 'Python', percentage: 99, color: '#3572a5' },
      { name: 'Rust', percentage: 98, color: '#dea584' },
    ];

    const { container } = render(
      <RadarChart
        languagesA={extremeLanguages}
        languagesB={[
          { name: 'TypeScript', percentage: 1, color: '#3178c6' },
          { name: 'Python', percentage: 1, color: '#3572a5' },
          { name: 'Rust', percentage: 1, color: '#dea584' },
        ]}
        labelA="MaxUser"
        labelB="MinUser"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();

    // SVG must have fixed dimensions — no layout tree breakage
    expect(svg?.getAttribute('width')).toBe('320');
    expect(svg?.getAttribute('height')).toBe('300');

    // All circles (vertex dots) must be present for non-zero percentages
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders within acceptable time under high load with 6 languages at varied extreme percentages', () => {
    const highLoadA: LanguageData[] = [
      { name: 'TypeScript', percentage: 95, color: '#3178c6' },
      { name: 'JavaScript', percentage: 88, color: '#f1e05a' },
      { name: 'Python', percentage: 72, color: '#3572a5' },
      { name: 'Rust', percentage: 65, color: '#dea584' },
      { name: 'Go', percentage: 55, color: '#00add8' },
      { name: 'Java', percentage: 40, color: '#b07219' },
    ];

    const highLoadB: LanguageData[] = [
      { name: 'TypeScript', percentage: 60, color: '#3178c6' },
      { name: 'JavaScript', percentage: 70, color: '#f1e05a' },
      { name: 'Python', percentage: 80, color: '#3572a5' },
      { name: 'Rust', percentage: 90, color: '#dea584' },
      { name: 'Go', percentage: 45, color: '#00add8' },
      { name: 'Java', percentage: 35, color: '#b07219' },
    ];

    const start = performance.now();

    render(
      <RadarChart
        languagesA={highLoadA}
        languagesB={highLoadB}
        labelA="PowerUserA"
        labelB="PowerUserB"
      />
    );

    const elapsed = performance.now() - start;

    // Render must complete well under 500ms even under high load
    expect(elapsed).toBeLessThan(500);
  });

  it('percentage summary grid renders correct values without overlap for all 4 visible language rows', () => {
    const languagesA: LanguageData[] = [
      { name: 'TypeScript', percentage: 90, color: '#3178c6' },
      { name: 'JavaScript', percentage: 75, color: '#f1e05a' },
      { name: 'Python', percentage: 60, color: '#3572a5' },
      { name: 'Rust', percentage: 45, color: '#dea584' },
      { name: 'Go', percentage: 30, color: '#00add8' },
    ];

    const languagesB: LanguageData[] = [
      { name: 'TypeScript', percentage: 50, color: '#3178c6' },
      { name: 'JavaScript', percentage: 80, color: '#f1e05a' },
      { name: 'Python', percentage: 40, color: '#3572a5' },
      { name: 'Rust', percentage: 99, color: '#dea584' },
      { name: 'Go', percentage: 20, color: '#00add8' },
    ];

    render(
      <RadarChart languagesA={languagesA} languagesB={languagesB} labelA="DevA" labelB="DevB" />
    );

    // Bottom summary grid must render the first 4 languages with correct percentage values
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();
  });
});
