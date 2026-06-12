import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GrowthTrendChart from './GrowthTrendChart';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    path: ({ children, ...props }: React.SVGProps<SVGPathElement>) => (
      <path {...props}>{children}</path>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function generateMassiveActivity(
  baseDate: Date,
  count: number,
  maxCommits: number
): Array<{ date: string; count: number }> {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    return {
      date: d.toISOString().split('T')[0],
      count: Math.floor(Math.random() * maxCommits),
    };
  });
}

describe('GrowthTrendChart - Massive Scaling (Variation 2)', () => {
  const baseDate = new Date();

  it('renders SVG chart elements with thousands of activity records per series', () => {
    const activityA = generateMassiveActivity(baseDate, 5000, 100);
    const activityB = generateMassiveActivity(baseDate, 5000, 100);

    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 500 180');

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('handles extreme high-bound commit values without overflow', () => {
    const extremeData = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      return {
        date: d.toISOString().split('T')[0],
        count: Number.MAX_SAFE_INTEGER,
      };
    });

    const { container } = render(
      <GrowthTrendChart
        activityA={extremeData}
        activityB={extremeData}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    const yLabels = container.querySelectorAll('text.font-mono');
    expect(yLabels.length).toBeGreaterThan(0);
  });

  it('renders month labels and legend text under heavy data load', () => {
    const activityA = generateMassiveActivity(baseDate, 10000, 1000);
    const activityB = generateMassiveActivity(baseDate, 10000, 1000);

    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    expect(screen.getByText('Contribution Growth Trend')).toBeInTheDocument();
    expect(screen.getByText('User A')).toBeInTheDocument();
    expect(screen.getByText('User B')).toBeInTheDocument();
    expect(screen.getByText('⚔️ Commit Battle Timeline')).toBeInTheDocument();
  });

  it('lays out SVG with all required structural elements', () => {
    const activityA = generateMassiveActivity(baseDate, 3000, 500);
    const activityB = generateMassiveActivity(baseDate, 3000, 500);

    const { container } = render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);

    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThan(0);

    const defs = container.querySelector('defs');
    expect(defs).toBeInTheDocument();
  });

  it('renders within acceptable execution time for thousands of records', () => {
    const activityA = generateMassiveActivity(baseDate, 5000, 200);
    const activityB = generateMassiveActivity(baseDate, 5000, 200);

    const start = performance.now();

    render(
      <GrowthTrendChart
        activityA={activityA}
        activityB={activityB}
        labelA="User A"
        labelB="User B"
      />
    );

    const end = performance.now();
    expect(end - start).toBeLessThan(5000);
  });
});
