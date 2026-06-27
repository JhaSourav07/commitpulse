/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      delete props.initial;
      delete props.whileInView;
      delete props.viewport;
      delete props.whileHover;
      delete props.transition;

      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  },
}));

vi.mock('lucide-react', () => ({
  Flame: (props: any) => <div data-testid="icon-flame" {...props} />,
  TrendingUp: (props: any) => <div data-testid="icon-trending-up" {...props} />,
  GitCommit: (props: any) => <div data-testid="icon-git-commit" {...props} />,
  LucideIcon: () => null,
}));

describe('StatsCard Responsive Breakpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
  });

  it('renders correctly on mobile viewport width', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
      />
    );

    expect(screen.getByText('Current Streak')).toBeInTheDocument();
  });

  it('renders value content without clipping on small screens', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="999"
        description="Consecutive contribution days"
        icon="Flame"
      />
    );

    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('renders description text on mobile layouts', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
      />
    );

    expect(screen.getByText('Consecutive contribution days')).toBeInTheDocument();
  });

  it('renders icon correctly on narrow viewports', () => {
    render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
      />
    );

    expect(screen.getByTestId('icon-flame')).toBeInTheDocument();
  });

  it('renders mini chart bars on mobile viewport', () => {
    const { container } = render(
      <StatsCard
        title="Current Streak"
        value="42"
        description="Consecutive contribution days"
        icon="Flame"
      />
    );

    const chartBars = container.querySelectorAll('.flex-1.bg-black, .flex-1.dark\\:bg-white');

    expect(chartBars.length).toBeGreaterThan(0);
  });
});
