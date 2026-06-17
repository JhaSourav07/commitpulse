import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepoPerformanceTable from './RepoPerformanceTable';

type RepoPerformanceData = React.ComponentProps<typeof RepoPerformanceTable>['data'];

type MotionDivProps = {
  children?: React.ReactNode;
  className?: string;
} & Record<string, unknown>;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: MotionDivProps) => {
      const validProps = Object.keys(props).reduce(
        (acc, key) => {
          if (!['initial', 'animate', 'transition'].includes(key)) {
            acc[key] = props[key];
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

describe('RepoPerformanceTable Empty / Missing Inputs', () => {
  const mockBaseData = {
    totalPRs: 0,
    openPRs: 0,
    mergedPRs: 0,
    closedPRs: 0,
    avgMergeTime: 0,
    avgReviewComments: 0,
    fastestMerged: null,
    mostDiscussed: null,
    largest: null,
    timeline: [],
    sizeDistribution: [],
    weekdayDistribution: [],
    monthlyTrend: [],
    reviewActivity: [],
    labels: [],
    authors: [],
    repoPerformance: [
      { name: 'octocat/commitpulse', totalPRs: 24, mergeRate: 75, reviewCount: 18 },
    ],
  } as unknown as RepoPerformanceData;

  it('renders empty state message when repoPerformance is an empty array', () => {
    const emptyData = { ...mockBaseData, repoPerformance: [] } as unknown as RepoPerformanceData;
    render(<RepoPerformanceTable data={emptyData} />);
    expect(screen.getByText(/no repository data available/i)).toBeInTheDocument();
  });

  it('renders empty state when repoPerformance is undefined', () => {
    const missingData = {
      ...mockBaseData,
      repoPerformance: undefined,
    } as unknown as RepoPerformanceData;
    render(<RepoPerformanceTable data={missingData} />);
    expect(screen.getByText(/no repository data available/i)).toBeInTheDocument();
  });

  it('renders empty state when repoPerformance is null', () => {
    const nullData = { ...mockBaseData, repoPerformance: null } as unknown as RepoPerformanceData;
    render(<RepoPerformanceTable data={nullData} />);
    expect(screen.getByText(/no repository data available/i)).toBeInTheDocument();
  });

  it('renders with a single repository entry', () => {
    render(<RepoPerformanceTable data={mockBaseData} />);
    expect(screen.getByText('commitpulse')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('renders gracefully when data is completely empty', () => {
    const emptyData = {} as unknown as RepoPerformanceData;
    render(<RepoPerformanceTable data={emptyData} />);
    expect(screen.getByText(/no repository data available/i)).toBeInTheDocument();
  });
});
