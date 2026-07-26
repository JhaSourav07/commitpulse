import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import RadarChart from './RadarChart';

// Mock framer-motion so animated elements render as plain SVG/HTML synchronously in jsdom without runtime warning
vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      whileInView?: unknown;
      viewport?: unknown;
      transition?: unknown;
    }
  >(({ children, className, style, ...props }, ref) => {
    const cleanProps = { ...props };
    delete cleanProps.initial;
    delete cleanProps.animate;
    delete cleanProps.whileInView;
    delete cleanProps.viewport;
    delete cleanProps.transition;

    return (
      <div ref={ref} className={className} style={style} {...cleanProps}>
        {children}
      </div>
    );
  });
  MotionDiv.displayName = 'MotionDiv';

  const MotionPolygon = React.forwardRef<
    SVGPolygonElement,
    React.SVGProps<SVGPolygonElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }
  >(({ children, className, style, ...props }, ref) => {
    const cleanProps = { ...props };
    delete cleanProps.initial;
    delete cleanProps.animate;
    delete cleanProps.transition;

    return (
      <polygon ref={ref} className={className} style={style} {...cleanProps}>
        {children}
      </polygon>
    );
  });
  MotionPolygon.displayName = 'MotionPolygon';

  return {
    motion: {
      div: MotionDiv,
      polygon: MotionPolygon,
    },
  };
});

interface MockErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface MockErrorBoundaryState {
  hasError: boolean;
}

class MockErrorBoundary extends Component<MockErrorBoundaryProps, MockErrorBoundaryState> {
  static displayName = 'MockErrorBoundary';

  constructor(props: MockErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): MockErrorBoundaryState {
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
        <div
          data-testid="error-recovery-panel"
          className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-900"
        >
          <h2>Something went wrong.</h2>
          <p>We could not render the language dominance radar chart.</p>
          <button
            onClick={this.props.onReset}
            data-testid="reset-button"
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('RadarChart - Error Resilience & Exception Safety', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error output from Vitest terminal output during deliberate throws
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Case 1: Pass null or broken nested data properties to simulate severe payload corruption and assert that the fallback mechanism intercepts the error safely.
  test('Case 1: should safely catch rendering error on malformed/corrupted languages payload data properties', () => {
    const onError = vi.fn();
    render(
      <MockErrorBoundary onError={onError}>
        {/* @ts-expect-error - Intentionally passing corrupted props to trigger error boundary */}
        <RadarChart languagesA={null} languagesB={[]} labelA="User A" labelB="User B" />
      </MockErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  // Case 2: Verify that standard fallback layouts or error warnings successfully expose recovery text blocks.
  test('Case 2: should display standard fallback layout recovery text blocks when error occurs', () => {
    render(
      <MockErrorBoundary>
        {/* @ts-expect-error - Intentionally passing corrupted props to trigger error boundary */}
        <RadarChart languagesA={[]} languagesB={undefined} labelA="User A" labelB="User B" />
      </MockErrorBoundary>
    );

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(
      screen.getByText(/We could not render the language dominance radar chart/i)
    ).toBeInTheDocument();
  });

  // Case 3: Assert that intercepted rendering exceptions are logged to dev-telemetry trackers appropriately.
  test('Case 3: should record caught exception into telemetry spy spy tracker appropriately', () => {
    const telemetrySpy = vi.fn();
    render(
      <MockErrorBoundary onError={(error) => telemetrySpy(error.message)}>
        {/* @ts-expect-error - Intentionally passing corrupted props to trigger error boundary */}
        <RadarChart languagesA={null} languagesB={null} labelA="User A" labelB="User B" />
      </MockErrorBoundary>
    );

    expect(telemetrySpy).toHaveBeenCalled();
    expect(telemetrySpy.mock.calls[0][0]).toMatch(/Cannot read properties of (null|undefined)/);
  });

  // Case 4: Ensure an interactive user retry/reload control action path is present on the recovery layout state.
  test('Case 4: should render actionable retry trigger link and handle clicks in the recovery layout', () => {
    const onResetSpy = vi.fn();
    render(
      <MockErrorBoundary onReset={onResetSpy}>
        {/* @ts-expect-error - Intentionally passing corrupted props to trigger error boundary */}
        <RadarChart languagesA={null} languagesB={[]} labelA="User A" labelB="User B" />
      </MockErrorBoundary>
    );

    const resetButton = screen.getByTestId('reset-button');
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);
    expect(onResetSpy).toHaveBeenCalled();
  });

  // Case 5: Verify hydration stability by ensuring empty uninitialized data bounds render default structural containers smoothly without triggering mismatch faults.
  test('Case 5: should render empty uninitialized datasets smoothly without crashing', () => {
    const { container } = render(
      <RadarChart languagesA={[]} languagesB={[]} labelA="Empty User A" labelB="Empty User B" />
    );

    // Should mount and display the default title and layout
    expect(screen.getByText('Language Dominance')).toBeInTheDocument();
    expect(screen.getByText('Empty User A')).toBeInTheDocument();
    expect(screen.getByText('Empty User B')).toBeInTheDocument();

    // With no language data the empty state is shown instead of an invented radar
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.getByText('No language data to compare yet')).toBeInTheDocument();
  });
});
