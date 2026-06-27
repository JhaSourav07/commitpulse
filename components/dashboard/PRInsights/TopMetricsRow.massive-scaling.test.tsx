import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import TopMetricsRow from './TopMetricsRow';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

function buildMassiveData(overrides = {}) {
  return {
    totalPRs: 999999999,
    mergeRate: 99999.999,
    avgCycleTime: 88888.888,
    avgTimeToFirstReview: 77777.777,
    weeklyActivity: Array.from({ length: 10000 }, (_, i) => ({
      name: `Week-${i}`,
      prs: i,
    })),
    ...overrides,
  };
}

describe('TopMetricsRow Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders extreme metric values without crashing', () => {
    render(<TopMetricsRow data={buildMassiveData() as never} />);

    expect(screen.getByText('999999999')).toBeInTheDocument();
    expect(screen.getByText('100000.0')).toBeInTheDocument();
    expect(screen.getByText('88888.9')).toBeInTheDocument();
    expect(screen.getByText('77777.8')).toBeInTheDocument();
  });

  it('renders successfully with a weekly activity dataset containing 10000 entries', () => {
    render(<TopMetricsRow data={buildMassiveData() as never} />);

    expect(screen.getByText('+9999 this week')).toBeInTheDocument();
  });

  it('uses the latest weekly activity entry from a massive dataset', () => {
    render(
      <TopMetricsRow
        data={
          buildMassiveData({
            weeklyActivity: [{ prs: 1 }, { prs: 5000 }, { prs: 25000 }],
          }) as never
        }
      />
    );

    expect(screen.getByText('+25000 this week')).toBeInTheDocument();
  });

  it('preserves grid layout classes under extreme high bounds values', () => {
    const { container } = render(<TopMetricsRow data={buildMassiveData() as never} />);

    expect(
      container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
    ).toBeInTheDocument();
  });

  it('re-renders correctly when switching between different massive datasets', () => {
    const { rerender } = render(<TopMetricsRow data={buildMassiveData() as never} />);

    expect(screen.getByText('999999999')).toBeInTheDocument();

    rerender(
      <TopMetricsRow
        data={
          buildMassiveData({
            totalPRs: 1234567890,
            weeklyActivity: [{ prs: 88888 }],
          }) as never
        }
      />
    );

    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('+88888 this week')).toBeInTheDocument();
  });
});
