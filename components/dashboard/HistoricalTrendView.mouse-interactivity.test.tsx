import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('HistoricalTrendView Mouse Interactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to previous period when Previous button is clicked', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    const previousButton = screen.getByRole('button', {
      name: /previous/i,
    });

    fireEvent.click(previousButton);

    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it('navigates to next period when Next button is clicked', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    const nextButton = screen.getByRole('button', {
      name: /next/i,
    });

    fireEvent.click(nextButton);

    expect(pushMock).toHaveBeenCalledTimes(1);
  });

  it('submits month selector form successfully', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    const monthInput = screen.getByDisplayValue('2025-05');

    fireEvent.change(monthInput, {
      target: { value: '2025-06' },
    });

    const goButtons = screen.getAllByRole('button', {
      name: /go/i,
    });

    fireEvent.click(goButtons[0]);

    expect(pushMock).toHaveBeenCalled();
  });

  it('submits year selector form successfully', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    const yearInput = screen.getByRole('spinbutton');

    fireEvent.change(yearInput, {
      target: { value: '2026' },
    });

    const goButtons = screen.getAllByRole('button', {
      name: /go/i,
    });

    fireEvent.click(goButtons[1]);

    expect(pushMock).toHaveBeenCalled();
  });

  it('submits custom date range successfully', () => {
    render(<HistoricalTrendView username="kanishka" activity={mockActivity} period={mockPeriod} />);

    const dateInputs = screen.getAllByDisplayValue('2025-05-01');

    fireEvent.change(dateInputs[0], {
      target: { value: '2025-05-01' },
    });

    const endDateInput = screen.getByDisplayValue('2025-05-31');

    fireEvent.change(endDateInput, {
      target: { value: '2025-05-31' },
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /apply range/i,
      })
    );

    expect(pushMock).toHaveBeenCalled();
  });
});
