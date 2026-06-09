import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StatsCard from './StatsCard';

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

const renderStatsCard = (props = {}) =>
  render(
    <StatsCard
      title="Total Commits"
      value="120"
      description="Commits this month"
      icon="GitCommit"
      {...props}
    />
  );

describe('StatsCard empty fallback', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses fallback icon when icon name is unknown', () => {
    renderStatsCard({ icon: 'UnknownIcon' });

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('does not render UTC fallback section when disclaimer is disabled', () => {
    renderStatsCard({
      showUTCDisclaimer: false,
      utcDate: undefined,
    });

    expect(screen.queryByText(/Streaks are calculated in UTC/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/UTC Date:/i)).not.toBeInTheDocument();
  });

  it('renders exactly 12 generated chart bars when chartData is empty', () => {
    const { container } = renderStatsCard({
      chartData: [],
    });

    const bars = container.querySelectorAll('[style*="height"]');

    expect(bars).toHaveLength(12);
  });

  it('uses provided chartData instead of fallback data', () => {
    const { container } = renderStatsCard({
      chartData: [10, 20, 30],
    });

    const bars = container.querySelectorAll('[style*="height"]');

    expect(bars).toHaveLength(3);
  });

  it('renders UTC date when disclaimer is enabled', () => {
    renderStatsCard({
      showUTCDisclaimer: true,
      utcDate: '2025-06-07',
    });

    expect(screen.getByText(/UTC Date: 2025-06-07/i)).toBeInTheDocument();
  });
});
