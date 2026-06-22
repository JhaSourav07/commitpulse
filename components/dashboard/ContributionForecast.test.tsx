import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ContributionForecast from './ContributionForecast';
import type { ActivityData } from '@/types/dashboard';

// Mock framer-motion to prevent animation issues during testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, whileHover, ...props }: Record<string, unknown>) => (
      <div className={className as string} {...props}>
        {children as React.ReactNode}
      </div>
    ),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up" />,
  TrendingDown: () => <div data-testid="trending-down" />,
  Minus: () => <div data-testid="minus" />,
  Sparkles: () => <div data-testid="sparkles" />,
  Calendar: () => <div data-testid="calendar" />,
  Zap: () => <div data-testid="zap" />,
  LineChart: () => <div data-testid="line-chart" />,
  Activity: () => <div data-testid="activity" />,
  Target: () => <div data-testid="target" />,
}));

describe('ContributionForecast', () => {
  // Helper for generating sequential active days
  const generateMockActivity = (counts: number[], startYear = 2026): ActivityData[] => {
    return counts.map((count, index) => {
      // pad with leading zero
      const dayStr = String(index + 1).padStart(2, '0');
      return {
        date: `${startYear}-06-${dayStr}`,
        count,
        intensity: count > 0 ? 3 : 0,
      };
    });
  };

  it('renders forecast headers and elements', () => {
    const activity = generateMockActivity([1, 2, 3]);
    render(<ContributionForecast activity={activity} />);

    expect(screen.getByRole('heading', { name: /Contribution Forecast/i })).toBeDefined();
    expect(screen.getByText(/Predict future growth/i)).toBeDefined();
  });

  it('calculates average weekly and monthly velocities correctly', () => {
    // 7 days, 2 commits each day
    // total commits = 14. avg daily = 2. weekly = 14. monthly = 60.
    const activity = generateMockActivity([2, 2, 2, 2, 2, 2, 2]);
    render(<ContributionForecast activity={activity} />);

    expect(screen.getByText('14.0 Commits/Week')).toBeDefined();
    expect(screen.getByText('60.0 Commits/Month')).toBeDefined();
  });

  it('handles empty activity data gracefully', () => {
    render(<ContributionForecast activity={[]} />);

    expect(
      screen.getByText(/No past activity data available to generate predictions/i)
    ).toBeDefined();
    expect(screen.queryByText('commits/wk')).toBeNull();
  });

  it('handles zero-commit activity history correctly', () => {
    const activity = generateMockActivity([0, 0, 0, 0, 0]);
    render(<ContributionForecast activity={activity} totalContributions={100} />);

    expect(screen.getByText('0.0 Commits/Week')).toBeDefined();
    expect(screen.getByText('0.0 Commits/Month')).toBeDefined();
    expect(screen.getByText('Inactive')).toBeDefined();
    expect(screen.getByText('Stable Rhythm')).toBeDefined();

    // Projections should equal currentTotal contributions (100) because slope and intercept are 0
    const projectedCommits = screen.getAllByText('100 Commits');
    expect(projectedCommits.length).toBeGreaterThanOrEqual(2);
  });

  it('correctly projects month-end and year-end contributions with linear regression', () => {
    // Let's create an increasing activity
    // counts: 1 to 10. last entry: 2026-06-10.
    // N = 10, meanX = 4.5, meanY = 5.5, slope = 1, intercept = 1
    // End of June (2026-06-30). Days remaining: 20 days.
    // Projected daily commits for days 11 to 30:
    // y_t = t + 1 (since slope=1, intercept=1).
    // For t = 10 to 29 (day index, where day 1 is index 0, day 30 is index 29):
    // index for future day is N - 1 + d = 9 + d.
    // y_t = (9 + d) * 1 + 1 = 10 + d.
    // For d = 1 to 20: 11 + 12 + ... + 30 = 410.
    // Current total in activity = 55.
    // Projected month end total = 55 + 410 = 465.
    const counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const activity = generateMockActivity(counts);

    render(<ContributionForecast activity={activity} />);

    // Since totalContributions is not specified, it falls back to sum of activity counts (55).
    // Month-End target should show 465 commits.
    expect(screen.getByText('465 Commits')).toBeDefined();
  });

  it('determines consistency rating and trend categories correctly', () => {
    // 10 days, 9 active days -> active ratio = 90% -> Elite consistency
    const activity = generateMockActivity([1, 2, 3, 0, 4, 5, 6, 7, 8, 9]);
    render(<ContributionForecast activity={activity} />);

    expect(screen.getByText('Elite (Very Consistent)')).toBeDefined();
    expect(screen.getByText('90% active days')).toBeDefined();

    // slope is positive and strong
    expect(screen.getByText('Strong Growth')).toBeDefined();
  });
});
