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

  it('renders safely when chartData is an empty array', () => {
    const { container } = renderStatsCard({ chartData: [] });

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();

    const fallbackBars = container.querySelectorAll('.flex-1.bg-black.dark\\:bg-white');
    expect(fallbackBars.length).toBe(12);
  });

  it('renders safely when chartData is missing', () => {
    const { container } = renderStatsCard();

    expect(screen.getByText('Commits this month')).toBeInTheDocument();

    const fallbackBars = container.querySelectorAll('.flex-1.bg-black.dark\\:bg-white');
    expect(fallbackBars.length).toBe(12);
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

  it('preserves default card styles in fallback state', () => {
    const { container } = renderStatsCard({
      chartData: [],
      icon: '',
    });

    const card = container.firstElementChild as HTMLElement;

    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('dark:bg-[#0a0a0a]');
    expect(card.className).toContain('overflow-hidden');
  });
});
