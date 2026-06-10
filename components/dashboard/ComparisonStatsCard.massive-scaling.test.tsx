import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import ComparisonStatsCard from './ComparisonStatsCard';

type MockMotionProps = {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
};

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionProps) => <div {...props}>{children}</div>,
  },
}));

describe('ComparisonStatsCard — Massive Data Sets & Extreme High Bounds', () => {
  it('renders correctly with very large values without crashing', () => {
    render(
      <ComparisonStatsCard
        title="Total Commits"
        valueA={999999999}
        valueB={888888888}
        labelA="userA"
        labelB="userB"
        icon="Flame"
      />
    );
    expect(screen.getByText('999999999')).toBeInTheDocument();
    expect(screen.getByText('888888888')).toBeInTheDocument();
  });

  it('correctly identifies winner with extreme values', () => {
    render(
      <ComparisonStatsCard
        title="Streak"
        valueA={999999999}
        valueB={1}
        labelA="userA"
        labelB="userB"
        icon="TrendingUp"
      />
    );
    const winners = screen.getAllByText('Winner');
    expect(winners).toHaveLength(1);
  });

  it('grid layout structure remains intact with extreme values', () => {
    const { container } = render(
      <ComparisonStatsCard
        title="Commits"
        valueA={1000000}
        valueB={1}
        labelA="userA"
        labelB="userB"
        icon="GitCommit"
      />
    );

    const grid = container.querySelector('.grid.grid-cols-2');
    expect(grid).toBeInTheDocument();

    expect(screen.getByText('1000000')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    const progressBar = container.querySelector('.w-full.h-2');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders within acceptable time with maximum values', () => {
    const start = performance.now();
    render(
      <ComparisonStatsCard
        title="Commits"
        valueA={Number.MAX_SAFE_INTEGER}
        valueB={Number.MAX_SAFE_INTEGER - 1}
        labelA="userA"
        labelB="userB"
        icon="Award"
      />
    );
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('renders both labels correctly with very long username strings', () => {
    const longName = 'a'.repeat(100);
    render(
      <ComparisonStatsCard
        title="Commits"
        valueA={500}
        valueB={400}
        labelA={longName}
        labelB={longName}
        icon="Users"
      />
    );
    const labels = screen.getAllByText(longName);
    expect(labels).toHaveLength(2);
  });
});
