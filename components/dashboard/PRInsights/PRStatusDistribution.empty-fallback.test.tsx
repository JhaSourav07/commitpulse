import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PRStatusDistribution from './PRStatusDistribution';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

type PRStatusData = React.ComponentProps<typeof PRStatusDistribution>['data'];

describe('PRStatusDistribution Empty/Missing Inputs Verification', () => {
  const zeroData = {
    totalPRs: 0,
    openPRs: 0,
    mergedPRs: 0,
    closedPRs: 0,
    additions: 0,
    deletions: 0,
  } as unknown as PRStatusData;

  it('renders heading and description when all PR counts are zero', () => {
    render(<PRStatusDistribution data={zeroData} />);
    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('Breakdown of PR states')).toBeInTheDocument();
  });

  it('displays total PRs as 0 when all values are zero', () => {
    render(<PRStatusDistribution data={zeroData} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders chart container with zero data', () => {
    const { container } = render(<PRStatusDistribution data={zeroData} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(container.querySelector('.rounded-3xl')).toBeInTheDocument();
  });

  it('renders without any legend items when all counts are zero', () => {
    render(<PRStatusDistribution data={zeroData} />);
    expect(screen.queryByText('Merged')).not.toBeInTheDocument();
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('renders correctly when only one PR status has a value', () => {
    const singleStatusData = {
      totalPRs: 5,
      openPRs: 0,
      mergedPRs: 5,
      closedPRs: 0,
      additions: 100,
      deletions: 20,
    } as unknown as PRStatusData;
    render(<PRStatusDistribution data={singleStatusData} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Merged')).toBeInTheDocument();
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });
});
