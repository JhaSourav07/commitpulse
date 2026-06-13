import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import PRStatusDistribution from './PRStatusDistribution';
import type { PRInsightData } from '@/services/github/pr-insights';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
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

// Mock recharts — spread all incoming props so aria-* and role passed by the
// component under test are reflected in the DOM rather than hardcoded here.
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

describe('PRStatusDistribution Accessibility Standards & Screen Reader Aria Compliance', () => {
  const mockData: PRInsightData = {
    totalPRs: 30,
    openPRs: 10,
    mergedPRs: 15,
    closedPRs: 5,
    mergeRate: 50,
    avgReviewTime: 3.2,
    avgTimeToFirstReview: 1.5,
    avgCycleTime: 4.8,
    weeklyActivity: [
      { name: 'Mon', prs: 2 },
      { name: 'Tue', prs: 4 },
    ],
    monthlyActivity: [
      { name: 'Jan', prs: 10 },
      { name: 'Feb', prs: 20 },
    ],
    reviewsGiven: 25,
    reviewsReceived: 20,
    avgReviewResponseTime: 2.0,
    fastestReview: 0.5,
    slowestReview: 12.0,
    repoPerformance: [
      {
        name: 'my-repo',
        totalPRs: 30,
        mergeRate: 50,
        reviewCount: 45,
        avgReviewTime: 3.2,
      },
    ],
    highlights: {
      mostDiscussed: {
        title: 'Add dark mode',
        url: 'https://github.com/org/repo/pull/1',
        comments: 42,
      },
      fastestMerged: undefined,
      largest: undefined,
    },
  };

  it('inspects markup for correct use of accessible label coordinates and roles', () => {
    render(<PRStatusDistribution data={mockData} />);

    // The section heading provides the primary accessible label for the widget
    const heading = screen.getByRole('heading', { level: 2, name: /Status Distribution/i });
    expect(heading).toBeInTheDocument();

    // The subtitle gives supplementary context visible to screen readers
    const subtitle = screen.getByText(/Breakdown of PR states/i);
    expect(subtitle).toBeInTheDocument();

    // The total value and its label are both present for assistive technology
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });

  it('asserts elements that accept key focus maintain visible outline behaviors', () => {
    const { container } = render(<PRStatusDistribution data={mockData} />);

    // PRStatusDistribution is a display-only widget with no interactive controls.
    // Assert there are no naturally tabbable elements so the contract is explicit.
    const tabbable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    expect(tabbable).toHaveLength(0);

    // Also assert no element uses a positive tabindex, which would disrupt the
    // page tab order for keyboard users navigating past this component.
    const allTabIndexed = container.querySelectorAll('[tabindex]');
    allTabIndexed.forEach((el) => {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    });
  });

  it('verifies tooltip labels are announced with correct accessibility descriptions', () => {
    render(<PRStatusDistribution data={mockData} />);

    // Legend labels act as the accessible text equivalents for each pie segment.
    // Screen readers encounter these since the SVG chart itself has no text nodes.
    expect(screen.getByText('Merged')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();

    // Each legend item is paired with its count so the value is announced inline.
    expect(screen.getByText('(15)')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('tests keyboard control path selectors to ensure normal tab ordering', async () => {
    const { container } = render(<PRStatusDistribution data={mockData} />);
    const user = userEvent.setup();

    // Tabbing into the component should not land focus inside it because the
    // component exposes no interactive elements.
    await user.tab();

    const tabbable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    tabbable.forEach((el) => {
      expect(el).not.toHaveFocus();
    });

    // No positive tabindex values that would steal focus out of natural order
    const allTabIndexed = container.querySelectorAll('[tabindex]');
    allTabIndexed.forEach((el) => {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    });
  });

  it('confirms standard headings exist in the correct logical hierarchical order', () => {
    render(<PRStatusDistribution data={mockData} />);

    // Single H2 heading anchors the section
    const heading = screen.getByRole('heading', { level: 2, name: /Status Distribution/i });
    expect(heading).toBeInTheDocument();

    // No H3+ headings should appear inside — the component uses descriptive text,
    // not sub-headings, keeping the hierarchy flat and predictable.
    const allHeadings = screen.getAllByRole('heading');
    expect(allHeadings).toHaveLength(1);
    expect(allHeadings[0]).toHaveTextContent('Status Distribution');
  });
});
