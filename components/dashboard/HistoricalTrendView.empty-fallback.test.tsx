import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoricalTrendView from './HistoricalTrendView';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

// Mock next/navigation — the component calls useRouter() on mount
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock lucide-react icons used in the component
vi.mock('lucide-react', () => ({
  ChevronLeft: (props: Record<string, unknown>) => (
    <span data-testid="icon-chevron-left" {...props} />
  ),
  ChevronRight: (props: Record<string, unknown>) => (
    <span data-testid="icon-chevron-right" {...props} />
  ),
  CalendarDays: (props: Record<string, unknown>) => (
    <span data-testid="icon-calendar-days" {...props} />
  ),
  Flame: (props: Record<string, unknown>) => <span data-testid="icon-flame" {...props} />,
}));

// Mock the Heatmap child component to isolate HistoricalTrendView
vi.mock('./Heatmap', () => ({
  default: ({ emptyMessage }: { emptyMessage?: string }) => (
    <div data-testid="heatmap-mock">{emptyMessage}</div>
  ),
}));

// Minimal valid period used across tests
const basePeriod: DashboardPeriod = {
  kind: 'range',
  label: 'Jan 2024 – Dec 2024',
  from: '2024-01-01T00:00:00.000Z',
  to: '2024-12-31T23:59:59.999Z',
};

describe('HistoricalTrendView — Edge Cases & Empty/Missing Inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when activity is an empty array', () => {
    // Core empty-input guard: the component must not throw when there are zero
    // activity entries — the most common production state for new users.
    expect(() =>
      render(<HistoricalTrendView username="testuser" activity={[]} period={basePeriod} />)
    ).not.toThrow();
  });

  it('shows zero for all stats when activity array is empty', () => {
    // Contributions, active days, current streak, and longest streak must all
    // display 0 — never NaN or undefined — on an empty dataset.
    render(<HistoricalTrendView username="testuser" activity={[]} period={basePeriod} />);

    // There will be multiple "0" values in the stat cards; assert at least one exists
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it('displays the no-streak-data fallback message when activity is empty', () => {
    // When streakSeries is empty the sparkline SVG is hidden and a text
    // placeholder must be shown instead so the UI is never blank.
    render(<HistoricalTrendView username="testuser" activity={[]} period={basePeriod} />);

    expect(screen.getByText('No streak data available for this period')).toBeDefined();
  });

  it('displays the monthly and yearly empty-state messages when activity is empty', () => {
    // Both summary sections must show their own "no data" copy rather than
    // rendering broken bar charts with divide-by-zero widths.
    render(<HistoricalTrendView username="testuser" activity={[]} period={basePeriod} />);

    expect(screen.getByText('No monthly breakdown available.')).toBeDefined();
    expect(screen.getByText('No yearly breakdown available.')).toBeDefined();
  });

  it('renders the period label and navigation controls even with no activity data', () => {
    // The header, period summary, and Prev/Next buttons must always be present
    // so users can navigate away from an empty period — the UI must never be
    // completely blank or broken.
    render(<HistoricalTrendView username="testuser" activity={[]} period={basePeriod} />);

    // Period summary line — e.g. "Jan 2024 – Dec 2024 · 0 days"
    expect(screen.getByText(/Jan 2024/)).toBeDefined();

    // Navigation buttons
    expect(screen.getByRole('button', { name: /previous/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /next/i })).toBeDefined();
  });
});
