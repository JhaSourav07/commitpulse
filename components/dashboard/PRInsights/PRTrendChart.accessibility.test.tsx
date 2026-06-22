import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import type { PRInsightData } from '@/services/github/pr-insights';
import PRTrendChart from './PRTrendChart';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockData = {
  totalPRs: 32,
  openPRs: 5,
  mergedPRs: 20,
  closedPRs: 7,
  mergeRate: 75,
  avgReviewTime: 1.2,
  avgTimeToFirstReview: 0.8,
  avgCycleTime: 2.5,
  weeklyActivity: [
    { name: 'Mon', prs: 2 },
    { name: 'Tue', prs: 4 },
  ],
  monthlyActivity: [
    { name: 'Jan', prs: 10 },
    { name: 'Feb', prs: 20 },
  ],
  reviewsGiven: 15,
  reviewsReceived: 12,
} satisfies Partial<PRInsightData>;

describe('PRTrendChart accessibility', () => {
  it('renders accessible heading for the chart section', () => {
    render(<PRTrendChart data={mockData as PRInsightData} />);

    expect(
      screen.getByRole('heading', {
        name: /activity trends/i,
        level: 2,
      })
    ).toBeInTheDocument();
  });

  it('renders view toggle buttons with accessible names', () => {
    render(<PRTrendChart data={mockData as PRInsightData} />);

    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument();
  });

  it('allows keyboard focus on weekly and monthly buttons', async () => {
    const user = userEvent.setup();
    render(<PRTrendChart data={mockData as PRInsightData} />);

    await user.tab();
    expect(screen.getByRole('button', { name: /weekly/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /monthly/i })).toHaveFocus();
  });

  it('changes chart view when weekly button is activated', async () => {
    const user = userEvent.setup();
    render(<PRTrendChart data={mockData as PRInsightData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });

    await user.click(weeklyButton);

    expect(weeklyButton).toHaveClass('bg-white');
  });

  it('changes chart view when monthly button is activated', async () => {
    const user = userEvent.setup();

    render(<PRTrendChart data={mockData as PRInsightData} />);

    const weeklyButton = screen.getByRole('button', { name: /weekly/i });
    const monthlyButton = screen.getByRole('button', { name: /monthly/i });

    await user.click(weeklyButton);
    await user.click(monthlyButton);

    expect(monthlyButton).toHaveClass('bg-white');
  });

  it('keeps heading hierarchy logical with h2 as main chart heading', () => {
    render(<PRTrendChart data={mockData as PRInsightData} />);

    const heading = screen.getByRole('heading', { name: /activity trends/i });

    expect(heading.tagName).toBe('H2');
  });
});
