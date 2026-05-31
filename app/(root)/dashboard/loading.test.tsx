import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardLoading from './loading';

vi.mock('@/components/dashboard/StatsCardSkeleton', () => ({
  default: () => <div data-testid="stats-card-skeleton" />,
}));

vi.mock('@/components/dashboard/AchievementsSkeleton', () => ({
  default: () => <div data-testid="achievements-skeleton" />,
}));

vi.mock('@/components/dashboard/AIInsightsSkeleton', () => ({
  default: () => <div data-testid="ai-insights-skeleton" />,
}));

describe('DashboardLoading', () => {
  it('renders without crashing', () => {
    const { container } = render(<DashboardLoading />);
    expect(container).toBeTruthy();
  });

  it('renders 2 StatsCardSkeleton components', () => {
    render(<DashboardLoading />);
    const skeletons = screen.getAllByTestId('stats-card-skeleton');
    expect(skeletons).toHaveLength(2);
  });

  it('renders shimmer skeleton elements in the left sidebar', () => {
    const { container } = render(<DashboardLoading />);
    const leftSidebar = container.querySelector('.grid > div:first-child');
    const shimmerElements = leftSidebar?.querySelectorAll('.shimmer');
    expect(shimmerElements?.length).toBeGreaterThan(0);
  });

  it('renders right sidebar skeleton components', () => {
    render(<DashboardLoading />);
    expect(screen.getByTestId('achievements-skeleton')).toBeTruthy();
    expect(screen.getByTestId('ai-insights-skeleton')).toBeTruthy();
  });
});
