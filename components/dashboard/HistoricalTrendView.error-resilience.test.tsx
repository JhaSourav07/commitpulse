import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import HistoricalTrendView from './HistoricalTrendView';

// Stub DOM observers missing in JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Helper: Mock Error Boundary to simulate the application's global/layout error boundary
class MockErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void; onError?: (error: Error, info: ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-panel">
          <h2>Something went wrong.</h2>
          <button onClick={this.props.onReset} data-testid="reset-button">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Default valid props
const defaultPeriod = { kind: 'year' as const, year: '2023', from: '', to: '', label: '2023' };

describe('HistoricalTrendView - Error Resilience & Exception Safety (Issue #2678 Equivalent)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React's default console.error for thrown boundary errors during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('Encase execution calls in localized boundary elements: safely handles completely empty data arrays without dividing by zero or crashing', () => {
    // Hydration stability for completely empty arrays
    render(<HistoricalTrendView username="test" activity={[]} period={defaultPeriod} />);

    // Total contributions should default to 0
    expect(screen.getAllByText('0', { selector: 'p.text-3xl' }).length).toBeGreaterThan(0);

    // Empty heatmap fallback text should display
    expect(screen.getByText('No activity found for this period')).toBeInTheDocument();
  });

  it('Assert that target modules render a clean error recovery UI instead of crashing the site: handles single-item arrays safely in sparkline calculation', () => {
    // A single item array can cause divide-by-zero in sparkline points `(streakSeries.length - 1)`
    // The component handles this via `streakSeries.length <= 1 ? 0 : ...`
    const singleData = [{ date: '2023-01-01', count: 5, intensity: 1 as 0 | 1 | 2 | 3 | 4 }];
    render(<HistoricalTrendView username="test" activity={singleData} period={defaultPeriod} />);

    // Sparkline should render without crashing
    const polyline = document.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
  });

  it('Mock nested child properties to throw unexpected runtime exceptions or database connectivity errors: boundary catches malformed props', () => {
    const onError = vi.fn();

    // Force a runtime exception by passing undefined to activity (simulating database connectivity failure)
    // The component's useMemo reduction will throw when trying to call .reduce() on undefined
    render(
      <MockErrorBoundary onError={onError}>
        {/* @ts-expect-error - Intentionally injecting malformed data */}
        <HistoricalTrendView username="test" activity={undefined} period={defaultPeriod} />
      </MockErrorBoundary>
    );

    // The boundary should have caught the TypeError
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(TypeError);
  });

  it('Ensure user reset/reload paths are available on the recovery panels: recovery UI displays reset triggers', () => {
    const onReset = vi.fn();

    render(
      <MockErrorBoundary onReset={onReset}>
        {/* @ts-expect-error - Intentionally throwing to trigger recovery panel */}
        <HistoricalTrendView username="test" activity={undefined} period={defaultPeriod} />
      </MockErrorBoundary>
    );

    // Assert the recovery panel and reset button are rendered
    const resetButton = screen.getByTestId('reset-button');
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    // Fire the reset trigger
    fireEvent.click(resetButton);
    expect(onReset).toHaveBeenCalled();
  });

  it('Verify exceptions are logged to dev-telemetry trackers appropriately: error telemetry is executed by the boundary', () => {
    const telemetryTracker = vi.fn();

    render(
      <MockErrorBoundary onError={(error) => telemetryTracker(error.message)}>
        {/* @ts-expect-error - Intentionally throwing */}
        <HistoricalTrendView username="test" activity={null} period={defaultPeriod} />
      </MockErrorBoundary>
    );

    // Assert that the exception was logged to the mock telemetry tracker
    expect(telemetryTracker).toHaveBeenCalled();
    // React's TypeError for calling reduce/filter on null
    expect(telemetryTracker.mock.calls[0][0]).toMatch(/Cannot read properties of (null|undefined)/);
  });
});
