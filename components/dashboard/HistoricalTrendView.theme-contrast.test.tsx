import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import HistoricalTrendView from './HistoricalTrendView';
import type { ActivityData } from '@/types/dashboard';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('./Heatmap', () => ({
  default: () => <div data-testid="heatmap">Heatmap</div>,
}));

const period: DashboardPeriod = {
  kind: 'month',
  month: '2025-05',
  label: 'May 2025',
  from: '2025-05-01T00:00:00.000Z',
  to: '2025-05-31T23:59:59.999Z',
};

const activity: ActivityData[] = [
  {
    date: '2025-05-01',
    count: 5,
    intensity: 4,
  },
  {
    date: '2025-05-02',
    count: 2,
    intensity: 2,
  },
];

describe('HistoricalTrendView theme contrast', () => {
  it('renders light mode background classes', () => {
    const { container } = render(
      <HistoricalTrendView username="tester" activity={activity} period={period} />
    );

    expect(container.innerHTML).toContain('bg-white');
    expect(container.innerHTML).toContain('text-gray-900');
  });

  it('includes dark mode styling classes', () => {
    const { container } = render(
      <HistoricalTrendView username="tester" activity={activity} period={period} />
    );

    expect(container.innerHTML).toContain('dark:bg-[#0a0a0a]');
    expect(container.innerHTML).toContain('dark:text-white');
  });

  it('renders text content with contrast-aware classes', () => {
    render(<HistoricalTrendView username="tester" activity={activity} period={period} />);

    expect(screen.getByText(/Explore long-term activity patterns/i)).toBeInTheDocument();

    expect(screen.getByText(/Contributions/i)).toBeInTheDocument();
  });

  it('renders foreground content without clipping overlays', () => {
    render(<HistoricalTrendView username="tester" activity={activity} period={period} />);

    expect(screen.getByText(/Monthly Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Yearly Summary/i)).toBeInTheDocument();
  });

  it('renders heatmap and statistics in both theme-capable layouts', () => {
    render(<HistoricalTrendView username="tester" activity={activity} period={period} />);

    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
    expect(screen.getByText(/Based on the selected activity window/i)).toBeInTheDocument();
  });
});
