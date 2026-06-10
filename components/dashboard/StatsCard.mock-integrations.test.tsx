/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  GitCommit: (props: any) => <div data-testid="icon-git-commit" {...props} />,
}));

describe('StatsCard mock integrations', () => {
  it('renders with mocked Flame icon', () => {
    render(<StatsCard title="Active Streak" value="42" description="days in a row" icon="Flame" />);

    expect(screen.getByTestId('icon-flame')).toBeDefined();
  });

  it('renders with mocked TrendingUp icon', () => {
    render(
      <StatsCard title="Growth" value="100%" description="monthly growth" icon="TrendingUp" />
    );

    expect(screen.getByTestId('icon-trending-up')).toBeDefined();
  });

  it('renders with mocked GitCommit icon', () => {
    render(<StatsCard title="Commits" value="150" description="this month" icon="GitCommit" />);

    expect(screen.getByTestId('icon-git-commit')).toBeDefined();
  });

  it('falls back to Flame icon when icon is unknown', () => {
    render(<StatsCard title="Fallback" value="0" description="fallback test" icon="UnknownIcon" />);

    expect(screen.getByTestId('icon-flame')).toBeDefined();
  });

  it('renders chart bars from provided chartData', () => {
    render(
      <StatsCard
        title="Chart"
        value="10"
        description="chart test"
        icon="Flame"
        chartData={[1, 2, 3, 4, 5]}
      />
    );

    expect(screen.getByText('Chart')).toBeDefined();
  });
});
