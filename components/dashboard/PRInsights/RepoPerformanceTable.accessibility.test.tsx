import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('RepoPerformanceTable Accessibility Standards & Screen Reader Aria Compliance', () => {
  const mockData = {
    totalPRs: 36,
    openPRs: 4,
    mergedPRs: 24,
    closedPRs: 8,
    avgMergeTime: 12,
    avgReviewComments: 3,
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
      {
        name: 'octocat/commitpulse',
        totalPRs: 24,
        mergeRate: 75,
        reviewCount: 18,
      },
      {
        name: 'octocat/dashboard',
        totalPRs: 12,
        mergeRate: 50,
        reviewCount: 9,
      },
    ],
  } as unknown as RepoPerformanceData;

  it('inspects markup for correct table roles and accessible column labels', () => {
    render(<RepoPerformanceTable data={mockData} />);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /repository performance/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /repository/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /prs/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /merge rate/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /reviews/i })).toBeInTheDocument();
  });

  it('asserts table content remains readable and available to screen readers', () => {
    render(<RepoPerformanceTable data={mockData} />);

    expect(screen.getByText('commitpulse')).toBeInTheDocument();
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('octocat')).toHaveLength(2);
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('verifies tooltip labels are exposed through repository title attributes', () => {
    render(<RepoPerformanceTable data={mockData} />);

    expect(screen.getByTitle('octocat/commitpulse')).toHaveTextContent('commitpulse');
    expect(screen.getByTitle('octocat/dashboard')).toHaveTextContent('dashboard');
  });

  it('tests keyboard control path selectors when no interactive table controls exist', async () => {
    render(<RepoPerformanceTable data={mockData} />);

    const user = userEvent.setup();
    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('confirms empty state exposes accessible fallback text when no repository data exists', () => {
    const emptyData = {
      ...mockData,
      repoPerformance: [],
    } as unknown as RepoPerformanceData;

    render(<RepoPerformanceTable data={emptyData} />);

    expect(screen.getByText(/no repository data available/i)).toBeInTheDocument();
  });
});
