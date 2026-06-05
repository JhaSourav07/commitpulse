import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoricalTrendView from './HistoricalTrendView';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';
import type { ActivityData } from '@/types/dashboard';
import '@testing-library/jest-dom/vitest';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('./Heatmap', () => ({
  default: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="heatmap">
      {title} - {subtitle}
    </div>
  ),
}));

const mockPeriod: DashboardPeriod = {
  kind: 'month',
  month: '2025-05',
  label: 'May 2025',
  from: '2025-05-01T00:00:00.000Z',
  to: '2025-05-31T23:59:59.999Z',
};

const mockActivity: ActivityData[] = [
  {
    date: '2025-05-01',
    count: 5,
    intensity: 4,
  },
  {
    date: '2025-05-02',
    count: 0,
    intensity: 0,
  },
  {
    date: '2025-05-03',
    count: 3,
    intensity: 2,
  },
];

describe('HistoricalTrendView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with activity data', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    expect(screen.getByText(/Historical Trend View/i)).toBeInTheDocument();

    expect(screen.getByText(/Explore long-term activity patterns/i)).toBeInTheDocument();
  });

  it('renders contribution statistics correctly', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    expect(screen.getByText(/contributions/i)).toBeTruthy();
    expect(screen.getByText(/active days/i)).toBeTruthy(); // active days
  });

  it('renders fallback state for empty activity', () => {
    render(<HistoricalTrendView username="kanishka" activity={[]} period={mockPeriod} />);

    expect(screen.getByText(/No streak data available for this period/i)).toBeInTheDocument();

    expect(screen.getByText(/No monthly breakdown available/i)).toBeInTheDocument();

    expect(screen.getByText(/No yearly breakdown available/i)).toBeInTheDocument();
  });

  it('renders heatmap component', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
  });

  it('renders navigation controls', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});
