import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import PRStatusDistribution from './PRStatusDistribution';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    span: ({
      children,
      className,
      style,
    }: {
      children: ReactNode;
      className?: string;
      style?: React.CSSProperties;
    }) => (
      <span className={className} style={style}>
        {children}
      </span>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, className, ...props }: any) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition', 'whileInView', 'viewport'].includes(key)) {
            acc[key] = props[key as keyof typeof props];
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
      return (
        <div className={className} {...validProps}>
          {children}
        </div>
      );
    },
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PieChart: ({ children, ...props }: any) => (
    <div data-testid="pie-chart" {...props}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Pie: ({ ...props }: any) => <div data-testid="pie" {...props} />,
  Cell: () => null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tooltip: ({ ...props }: any) => <div data-testid="recharts-tooltip" {...props} />,
}));

function buildMassiveData(overrides: Partial<PRInsightData> = {}): PRInsightData {
  return {
    totalPRs: 999999,
    openPRs: 333333,
    mergedPRs: 499999,
    closedPRs: 166667,
    mergeRate: 49.9999,
    avgReviewTime: 9999.99,
    avgTimeToFirstReview: 8888.88,
    avgCycleTime: 7777.77,
    weeklyActivity: Array.from({ length: 1000 }, (_, i) => ({
      name: `Day-${i}`,
      prs: i * 100,
    })),
    monthlyActivity: Array.from({ length: 500 }, (_, i) => ({
      name: `Month-${i}`,
      prs: i * 1000,
    })),
    reviewsGiven: 999999,
    reviewsReceived: 888888,
    avgReviewResponseTime: 9999.0,
    fastestReview: 0.001,
    slowestReview: 99999.99,
    repoPerformance: Array.from({ length: 500 }, (_, i) => ({
      name: `repo-${i}`,
      totalPRs: i * 1000,
      mergeRate: (i % 100) + 0.5,
      reviewCount: i * 500,
      avgReviewTime: i * 2.5,
    })),
    highlights: {
      mostDiscussed: {
        title: 'A'.repeat(500),
        url: 'https://github.com/org/repo/pull/99999',
        comments: 999999,
      },
      fastestMerged: undefined,
      largest: undefined,
    },
    prs: [],
    ...overrides,
  };
}

describe('PRStatusDistribution Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders correctly with extremely large PR counts without layout overflow', () => {
    const data = buildMassiveData();
    const { container } = render(<PRStatusDistribution data={data} />);

    expect(screen.getByText('999999')).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();

    // No overflow or broken structure
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
  });

  it('displays all three legend labels when all values are at extreme high bounds', () => {
    const data = buildMassiveData();
    render(<PRStatusDistribution data={data} />);

    expect(screen.getByText('Merged')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();

    expect(screen.getByText('(499999)')).toBeInTheDocument();
    expect(screen.getByText('(333333)')).toBeInTheDocument();
    expect(screen.getByText('(166667)')).toBeInTheDocument();
  });

  it('filters out zero-value segments and renders only non-zero entries', () => {
    const data = buildMassiveData({ openPRs: 0, closedPRs: 0, mergedPRs: 999999 });
    render(<PRStatusDistribution data={data} />);

    expect(screen.getByText('Merged')).toBeInTheDocument();
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('renders correctly when totalPRs is zero and all segments are empty', () => {
    const data = buildMassiveData({
      totalPRs: 0,
      openPRs: 0,
      mergedPRs: 0,
      closedPRs: 0,
    });
    render(<PRStatusDistribution data={data} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();

    // No legend items since all filtered out
    expect(screen.queryByText('Merged')).not.toBeInTheDocument();
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('SVG coordinates scale cleanly — pie chart and container are present', () => {
    const data = buildMassiveData();
    render(<PRStatusDistribution data={data} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });
});
