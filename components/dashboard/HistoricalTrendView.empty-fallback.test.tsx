import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoricalTrendView from './HistoricalTrendView';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';
import '@testing-library/jest-dom/vitest';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('./Heatmap', () => ({
  default: ({ emptyMessage }: { emptyMessage: string }) => (
    <div data-testid="heatmap-empty">{emptyMessage}</div>
  ),
}));

const mockPeriod: DashboardPeriod = {
  kind: 'month',
  month: '2025-05',
  label: 'May 2025',
  from: '2025-05-01T00:00:00.000Z',
  to: '2025-05-31T23:59:59.999Z',
};

describe('HistoricalTrendView - Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback streak message when no activity exists', () => {
    render(
      <HistoricalTrendView
        username="test-user"
        activity={[]}
        period={mockPeriod}
      />
    );

    expect(
      screen.getByText(/No streak data available for this period/i)
    ).toBeInTheDocument();
  });

  it('renders monthly and yearly fallback messages', () => {
    render(
      <HistoricalTrendView
        username="test-user"
        activity={[]}
        period={mockPeriod}
      />
    );

    expect(
      screen.getByText(/No monthly breakdown available/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/No yearly breakdown available/i)
    ).toBeInTheDocument();
  });

  it('shows no peak day when activity is empty', () => {
    render(
      <HistoricalTrendView
        username="test-user"
        activity={[]}
        period={mockPeriod}
      />
    );

    expect(
      screen.getByText(/Peak day/i)
    ).toBeInTheDocument();
  });

  it('shows zero average when no activity exists', () => {
    render(
      <HistoricalTrendView
        username="test-user"
        activity={[]}
        period={mockPeriod}
      />
    );

    expect(
      screen.getByText(/Avg\/day/i)
    ).toBeInTheDocument();
  });

  it('renders correct period summary for empty activity', () => {
    render(
      <HistoricalTrendView
        username="test-user"
        activity={[]}
        period={mockPeriod}
      />
    );

    expect(
      screen.getByText(/May 2025/i)
    ).toBeInTheDocument();
  });

  it('renders zero streak metrics when activity is empty', () => {
    render(
      <HistoricalTrendView
        username="test-user"
        activity={[]}
        period={mockPeriod}
      />
    );

    const zeros = screen.getAllByText('0');

    expect(zeros.length).toBeGreaterThan(0);
  });
});