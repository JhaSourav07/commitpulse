import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StatsCard from './StatsCard';

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

const renderStatsCard = () =>
  render(
    <StatsCard
      title="Total Commits"
      value="120"
      description="Commits this month"
      icon="GitCommit"
      showUTCDisclaimer
      utcDate="2026-06-04"
      chartData={[20, 40, 60, 80]}
    />
  );

describe('StatsCard accessibility', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders accessible title, value, and description text', () => {
    renderStatsCard();

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Commits this month')).toBeInTheDocument();
  });

  it('renders UTC disclaimer as readable assistive text', () => {
    renderStatsCard();

    expect(screen.getByText(/Streaks are calculated in UTC/i)).toBeInTheDocument();

    expect(screen.getByText('UTC Date: 2026-06-04')).toBeInTheDocument();
  });

  it('does not expose decorative chart bars as interactive controls', () => {
    const { container } = renderStatsCard();

    const chartBars = container.querySelectorAll('.flex-1.bg-black.dark\\:bg-white');

    expect(chartBars.length).toBe(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps keyboard tab order clean with no unexpected focusable elements', async () => {
    const user = userEvent.setup();

    renderStatsCard();

    await user.tab();

    expect(document.body).toHaveFocus();
  });

  it('uses non-heading text structure without breaking heading hierarchy', () => {
    renderStatsCard();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Total Commits').tagName.toLowerCase()).toBe('p');
    expect(screen.getByText('120').tagName.toLowerCase()).toBe('p');
    expect(screen.getByText('Commits this month').tagName.toLowerCase()).toBe('p');
  });
});
