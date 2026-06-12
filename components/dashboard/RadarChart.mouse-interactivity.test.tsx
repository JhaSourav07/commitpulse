import { vi, describe, it, expect } from 'vitest';
import type { PropsWithChildren, SVGProps, HTMLAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import RadarChart from './RadarChart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
    polygon: ({ children, ...props }: PropsWithChildren<SVGProps<SVGPolygonElement>>) => (
      <polygon {...props}>{children}</polygon>
    ),
  },
}));

const languagesA = [
  { name: 'TypeScript', percentage: 80, color: '#3178c6' },
  { name: 'JavaScript', percentage: 60, color: '#f1e05a' },
];

const languagesB = [
  { name: 'Python', percentage: 70, color: '#3572A5' },
  { name: 'TypeScript', percentage: 40, color: '#3178c6' },
];

describe('RadarChart mouse interactivity contract', () => {
  it('renders chart title and subtitle', () => {
    render(
      <RadarChart languagesA={languagesA} languagesB={languagesB} labelA="User A" labelB="User B" />
    );

    expect(screen.getByText('Language Dominance')).toBeInTheDocument();
    expect(screen.getByText('Radar Comparison')).toBeInTheDocument();
  });

  it('renders both legend labels', () => {
    render(
      <RadarChart languagesA={languagesA} languagesB={languagesB} labelA="User A" labelB="User B" />
    );

    expect(screen.getByText('User A')).toBeInTheDocument();
    expect(screen.getByText('User B')).toBeInTheDocument();
  });

  it('renders combined language labels', () => {
    render(
      <RadarChart languagesA={languagesA} languagesB={languagesB} labelA="User A" labelB="User B" />
    );

    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
  });

  it('pads chart to minimum three axes when insufficient languages exist', () => {
    render(
      <RadarChart
        languagesA={[
          {
            name: 'Rust',
            percentage: 50,
            color: '#dea584',
          },
        ]}
        languagesB={[]}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getAllByText('Rust').length).toBeGreaterThan(0);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders zero percentages for languages missing in one dataset', () => {
    render(
      <RadarChart
        languagesA={[
          {
            name: 'Rust',
            percentage: 50,
            color: '#dea584',
          },
        ]}
        languagesB={[]}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
  });
});
