/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RadarChart from './RadarChart';

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

describe('RadarChart Accessibility', () => {
  const mockLanguagesA = [
    { name: 'TypeScript', percentage: 70, color: '#3178c6' },
    { name: 'Python', percentage: 30, color: '#3572A5' },
  ];

  const mockLanguagesB = [
    { name: 'TypeScript', percentage: 50, color: '#3178c6' },
    { name: 'JavaScript', percentage: 50, color: '#f1e05a' },
  ];

  const renderRadarChart = () =>
    render(
      <RadarChart
        languagesA={mockLanguagesA}
        languagesB={mockLanguagesB}
        labelA="Developer A"
        labelB="Developer B"
      />
    );

  it('renders an accessible heading', () => {
    renderRadarChart();

    expect(screen.getByRole('heading', { name: /language dominance/i })).toBeInTheDocument();
  });

  it('renders legend labels for both compared users', () => {
    renderRadarChart();

    expect(screen.getByText('Developer A')).toBeInTheDocument();
    expect(screen.getByText('Developer B')).toBeInTheDocument();
  });

  it('renders language labels visible to assistive technologies', () => {
    renderRadarChart();

    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
  });

  it('renders svg chart structure', () => {
    const { container } = renderRadarChart();

    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('renders accessible empty state message when no language data exists', () => {
    render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="Developer A" labelB="Developer B" />
    );

    expect(screen.getByText(/no language data to compare yet/i)).toBeInTheDocument();
  });
});
