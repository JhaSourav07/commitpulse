/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => (
      <div {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  GitCommit: (props: any) => <div data-testid="icon-git-commit" {...props} />,
  LucideIcon: () => null,
}));

describe('StatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: renders title prop text
  it('should render the title prop text', () => {
    render(<StatsCard title="Active Streak" value="42" description="days in a row" icon="Flame" />);

    expect(screen.getByText('Active Streak')).toBeDefined();
  });

  // Test 2: renders value prop text
  it('should render the value prop text', () => {
    render(<StatsCard title="Active Streak" value="42" description="days in a row" icon="Flame" />);

    expect(screen.getByText('42')).toBeDefined();
  });

  // Test 3: renders description prop text
  it('should render the description prop text', () => {
    render(<StatsCard title="Active Streak" value="42" description="days in a row" icon="Flame" />);

    expect(screen.getByText('days in a row')).toBeDefined();
  });

  // Test 4: UTC disclaimer appears when showUTCDisclaimer=true
  it('should display UTC disclaimer when showUTCDisclaimer is true', () => {
    render(
      <StatsCard
        title="Active Streak"
        value="42"
        description="days in a row"
        icon="Flame"
        showUTCDisclaimer={true}
      />
    );

    expect(
      screen.getByText(/Streaks are calculated in UTC and may differ from your local timezone/i)
    ).toBeDefined();
  });

  // Test 5: UTC disclaimer is absent when showUTCDisclaimer=false
  it('should not display UTC disclaimer when showUTCDisclaimer is false', () => {
    render(
      <StatsCard
        title="Active Streak"
        value="42"
        description="days in a row"
        icon="Flame"
        showUTCDisclaimer={false}
      />
    );

    expect(
      screen.queryByText(/Streaks are calculated in UTC and may differ from your local timezone/i)
    ).toBeNull();
  });

  // Test 6: utcDate string appears when provided with disclaimer
  it('should display utcDate when provided along with showUTCDisclaimer=true', () => {
    render(
      <StatsCard
        title="Active Streak"
        value="42"
        description="days in a row"
        icon="Flame"
        showUTCDisclaimer={true}
        utcDate="2024-01-15"
      />
    );

    expect(screen.getByText(/UTC Date: 2024-01-15/)).toBeDefined();
  });

  // Test 7: falls back to Flame icon for unknown icon name
  it('should fall back to Flame icon when icon name is unknown', () => {
    render(
      <StatsCard title="Active Streak" value="42" description="days in a row" icon="UnknownIcon" />
    );

    expect(screen.getByTestId('icon-flame')).toBeDefined();
  });
});
