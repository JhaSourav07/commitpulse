import React, { Component, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HistoricalTrendView from './HistoricalTrendView';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('./Heatmap', () => ({
  default: ({
    data,
    emptyMessage,
    title,
  }: {
    data: unknown[];
    emptyMessage: string;
    title: string;
  }) => (
    <div data-testid="historical-heatmap">
      <span>{title}</span>
      {data.length === 0 ? <p data-testid="heatmap-empty-marker">{emptyMessage}</p> : null}
    </div>
  ),
}));

interface BoundaryState {
  error: Error | null;
}

class LocalErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return (
        <section role="alert" data-testid="empty-input-error-fallback">
          <p>Historical activity could not be loaded.</p>
        </section>
      );
    }

    return this.props.children;
  }
}

const emptyPeriod: DashboardPeriod = {
  kind: 'month',
  month: '2026-01',
  label: 'Jan 2026',
  from: '2026-01-01T00:00:00.000Z',
  to: '2026-01-31T23:59:59.999Z',
};

describe('HistoricalTrendView - Empty & Missing Input Fallbacks', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    consoleError.mockRestore();
    vi.useRealTimers();
  });

  it('renders clear empty-state messaging when activity is an empty array', () => {
    render(<HistoricalTrendView username="pari" activity={[]} period={emptyPeriod} />);

    expect(screen.getByText(/No streak data available for this period/i)).toBeInTheDocument();
    expect(screen.getByText(/No monthly breakdown available/i)).toBeInTheDocument();
    expect(screen.getByText(/No yearly breakdown available/i)).toBeInTheDocument();

    expect(screen.getByTestId('heatmap-empty-marker')).toHaveTextContent(
      'No activity found for this period'
    );
  });

  it('maintains the standard empty layout styling and structure', () => {
    const { container } = render(
      <HistoricalTrendView username="pari" activity={[]} period={emptyPeriod} />
    );

    const shell = container.querySelector('section');

    expect(shell).not.toBeNull();

    expect(shell).toHaveClass('rounded-xl');
    expect(shell).toHaveClass('border');
    expect(shell).toHaveClass('bg-white');

    expect(screen.getByText('Contributions')).toBeInTheDocument();
    expect(screen.getByText('Active Days')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
  });

  it('does not log unexpected runtime errors or hydration warnings for empty activity', () => {
    expect(() =>
      render(<HistoricalTrendView username="pari" activity={[]} period={emptyPeriod} />)
    ).not.toThrow();

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders key empty DOM markers instead of broken SVG or list structures', () => {
    const { container } = render(
      <HistoricalTrendView username="pari" activity={[]} period={emptyPeriod} />
    );

    expect(container.querySelector('polyline')).not.toBeInTheDocument();

    expect(screen.getByText('No monthly breakdown available.')).toBeInTheDocument();
    expect(screen.getByText('No yearly breakdown available.')).toBeInTheDocument();

    expect(screen.getByTestId('historical-heatmap')).toBeInTheDocument();
  });

  it('shows a localized recovery fallback when missing activity data is supplied', () => {
    const onError = vi.fn();

    render(
      <LocalErrorBoundary onError={onError}>
        {/* @ts-expect-error - intentionally verifies malformed production input resilience */}
        <HistoricalTrendView username="pari" activity={null} period={emptyPeriod} />
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('empty-input-error-fallback')).toBeInTheDocument();

    expect(screen.getByRole('alert')).toHaveTextContent('Historical activity could not be loaded.');

    expect(onError).toHaveBeenCalledOnce();
  });
});
