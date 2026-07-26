import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardSkeleton from './DashboardSkeleton';

vi.mock('./AchievementsSkeleton', () => ({
  default: () => <div data-testid="achievements-skeleton" />,
}));

vi.mock('./AIInsightsSkeleton', () => ({
  default: () => <div data-testid="ai-insights-skeleton" />,
}));

vi.mock('./StatsCardSkeleton', () => ({
  default: () => <div data-testid="stats-card-skeleton" />,
}));

describe('DashboardSkeleton - Massive Data Sets and Extreme High Bounds Scaling', () => {
  it('renders all 10 shimmer skeleton bones without crashing or silently dropping any element', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(container.firstChild).toBeInTheDocument();

    // Every shimmer bone defined in the component JSX must be present in the DOM
    const shimmerElements = container.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBe(10);
  });

  it('preserves the three-column grid root structure with exactly 3 direct children', () => {
    const { container } = render(<DashboardSkeleton />);

    // Root grid container must exist
    const gridRoot = container.querySelector('div.grid');
    expect(gridRoot).toBeInTheDocument();

    // Three direct children: left sidebar, center column, right sidebar
    expect(gridRoot?.children.length).toBe(3);
  });

  it('mounts all sub-skeleton child components with correct multiplicity', () => {
    render(<DashboardSkeleton />);

    // AchievementsSkeleton and AIInsightsSkeleton must render exactly once each
    expect(screen.getByTestId('achievements-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('ai-insights-skeleton')).toBeInTheDocument();

    // StatsCardSkeleton must render exactly 3 times — no card missing or duplicated
    const statsCards = screen.getAllByTestId('stats-card-skeleton');
    expect(statsCards.length).toBe(3);
  });

  it('completes 100 sequential mount and unmount cycles within 2000ms performance limit', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<DashboardSkeleton />);
      unmount();
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(2000);
  });

  it('produces an identical shimmer count across 50 repeated renders without DOM corruption', () => {
    for (let i = 0; i < 50; i++) {
      const { container, unmount } = render(<DashboardSkeleton />);

      // Every render must produce the same 10 shimmer bones — no structural drift
      const shimmerElements = container.querySelectorAll('.shimmer');
      expect(shimmerElements.length).toBe(10);

      unmount();
    }
  });
});
