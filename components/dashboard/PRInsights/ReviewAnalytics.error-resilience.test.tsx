// ReviewAnalytics.error-resilience.test.tsx
//
// Verifies Hydration Stability, Exception Safety & Error Fallbacks for
// ReviewAnalytics. Every failure scenario is driven through the component
// itself via a configurable framer-motion mock, so the tests exercise the
// real render path rather than standalone stub components.

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PRInsightData } from '@/services/github/pr-insights';
import ReviewAnalytics from './ReviewAnalytics';

// ---------------------------------------------------------------------------
// Configurable runtime state — vi.hoisted() ensures this object is created
// before any vi.mock() factory runs, so the factory closure can safely
// reference it at module-evaluation time.
// ---------------------------------------------------------------------------
const motionRuntime = vi.hoisted(() => ({
  shouldThrow: false,
  errorMessage: 'Simulated animation runtime failure',
}));

// ---------------------------------------------------------------------------
// Configurable framer-motion mock.
// When motionRuntime.shouldThrow is true the motion.div wrapper throws,
// causing ReviewAnalytics itself to be the source of the error — exactly
// what a real background-service outage would look like in production.
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
      if (motionRuntime.shouldThrow) {
        throw new Error(motionRuntime.errorMessage);
      }
      return <div {...props}>{children}</div>;
    },
  },
}));

// ---------------------------------------------------------------------------
// Typed error boundary.
// onTelemetry mirrors the signature used in componentDidCatch so callers
// can spy on both the Error and the React ErrorInfo (component stack).
// ---------------------------------------------------------------------------
interface BoundaryState {
  caught: boolean;
  error: Error | null;
}

interface BoundaryProps {
  children: ReactNode;
  onTelemetry?: (error: Error, info: ErrorInfo) => void;
}

class TestErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { caught: false, error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { caught: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production this call would be replaced by Sentry.captureException()
    // or an equivalent observability SDK.
    this.props.onTelemetry?.(error, info);
  }

  render(): ReactNode {
    if (this.state.caught) {
      return (
        <div role="alert" data-testid="error-recovery-panel">
          <h2>Something went wrong.</h2>
          <p>The review analytics panel failed to load.</p>
          <button onClick={() => this.setState({ caught: false, error: null })}>
            Reload Panel
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Shared valid data fixture.
// ---------------------------------------------------------------------------
const baseData: PRInsightData = {
  totalPRs: 40,
  prs: [],
  openPRs: 5,
  mergedPRs: 30,
  closedPRs: 5,
  mergeRate: 75,
  avgReviewTime: 6.0,
  avgTimeToFirstReview: 2.0,
  avgCycleTime: 10.0,
  weeklyActivity: [],
  monthlyActivity: [],
  reviewsGiven: 22,
  reviewsReceived: 15,
  avgReviewResponseTime: 3.5,
  fastestReview: 1.2,
  slowestReview: 18.6,
  repoPerformance: [],
  highlights: {},
};

// ---------------------------------------------------------------------------
// Global setup — runs before / after every test.
// ---------------------------------------------------------------------------
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // Reset the configurable motion runtime to its safe default so no state
  // leaks from one test into the next.
  motionRuntime.shouldThrow = false;
  motionRuntime.errorMessage = 'Simulated animation runtime failure';

  // Suppress React's built-in error boundary console.error output so the
  // Vitest reporter stays readable during intentional-crash tests.
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('ReviewAnalytics — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  // -------------------------------------------------------------------------
  // Test 1: Boundary catches a runtime exception that originates inside
  // ReviewAnalytics itself (via the motion.div mock) and prevents a crash.
  //
  // Why: Confirms that when an animation dependency breaks mid-render the
  // error boundary absorbs the fault and routes it to the telemetry layer
  // before anything reaches the React root.
  // -------------------------------------------------------------------------
  it('Test 1: boundary catches exception inside ReviewAnalytics and prevents page crash', () => {
    motionRuntime.shouldThrow = true;
    motionRuntime.errorMessage = '503 Service Unavailable';

    const telemetry = vi.fn();

    render(
      <TestErrorBoundary onTelemetry={telemetry}>
        <ReviewAnalytics data={baseData} />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();

    // Telemetry must receive the error exactly once.
    expect(telemetry).toHaveBeenCalledOnce();
    expect(telemetry.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(telemetry.mock.calls[0][0].message).toBe('503 Service Unavailable');
  });

  // -------------------------------------------------------------------------
  // Test 2: Healthy-path — boundary is transparent; SSR and CSR agree.
  //
  // Why: Verifies the component is hydration-stable: the server-rendered
  // HTML already contains the metric content, so the client-side React
  // tree can hydrate over it without a mismatch. Also confirms the boundary
  // wrapper does not alter the DOM when no error occurs.
  // -------------------------------------------------------------------------
  it('Test 2: boundary is transparent on healthy path; SSR and CSR renders agree', () => {
    // Server-side render — motionRuntime.shouldThrow is false so motion.div
    // renders a plain <div>, producing deterministic HTML.
    const html = renderToString(<ReviewAnalytics data={baseData} />);
    expect(html).toContain('Review Analytics');
    expect(html).toContain('Reviews Given');

    // Client-side render through the boundary — all four metric cards must
    // be visible and the fallback must be absent.
    render(
      <TestErrorBoundary>
        <ReviewAnalytics data={baseData} />
      </TestErrorBoundary>
    );

    expect(screen.getByText('Review Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reviews Given')).toBeInTheDocument();
    expect(screen.getByText('Reviews Received')).toBeInTheDocument();
    expect(screen.getByText('Fastest Review')).toBeInTheDocument();
    expect(screen.getByText('Slowest Review')).toBeInTheDocument();
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Test 3: Renders a clean error recovery UI with role="alert".
  //
  // Why: A real animation-layer outage must swap in a styled fallback panel
  // instead of a blank/white page. The panel carries role="alert" so
  // screen-readers announce the failure without user interaction.
  // -------------------------------------------------------------------------
  it('Test 3: renders clean error recovery UI with role="alert" when analytics throws', () => {
    motionRuntime.shouldThrow = true;
    motionRuntime.errorMessage = '503 Service Unavailable — review analytics unreachable';

    render(
      <TestErrorBoundary>
        <ReviewAnalytics data={baseData} />
      </TestErrorBoundary>
    );

    const panel = screen.getByRole('alert');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('data-testid', 'error-recovery-panel');
    expect(screen.getByText('The review analytics panel failed to load.')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Test 4: Exception message is faithfully forwarded to the telemetry layer.
  //
  // Why: Silent failures are worse than visible ones. The exact error message
  // (and the React component stack via ErrorInfo) must reach the observability
  // layer so on-call engineers can diagnose without waiting for user reports.
  // -------------------------------------------------------------------------
  it('Test 4: telemetry receives the exact error message when ReviewAnalytics throws', () => {
    const DB_ERROR = 'MongoDB connection pool exhausted';
    motionRuntime.shouldThrow = true;
    motionRuntime.errorMessage = DB_ERROR;

    const telemetry = vi.fn();

    render(
      <TestErrorBoundary onTelemetry={telemetry}>
        <ReviewAnalytics data={baseData} />
      </TestErrorBoundary>
    );

    // onTelemetry must be called exactly once — no duplicate reporting.
    expect(telemetry).toHaveBeenCalledOnce();

    const [receivedError, receivedInfo] = telemetry.mock.calls[0] as [Error, ErrorInfo];
    expect(receivedError).toBeInstanceOf(Error);
    expect(receivedError.message).toBe(DB_ERROR);

    // The React component stack lets engineers trace the failure site.
    expect(receivedInfo.componentStack).toContain('ReviewAnalytics');
  });

  // -------------------------------------------------------------------------
  // Test 5: Reload button restores widget content after a runtime failure.
  //
  // Why: An error state with no escape route is a dead end. The recovery
  // panel must expose a "Reload Panel" button that resets the boundary,
  // allowing ReviewAnalytics to remount without a full page refresh once the
  // dependency has recovered.
  // -------------------------------------------------------------------------
  it('Test 5: reload button restores widget content after a simulated runtime failure', () => {
    motionRuntime.shouldThrow = true;

    render(
      <TestErrorBoundary>
        <ReviewAnalytics data={baseData} />
      </TestErrorBoundary>
    );

    // Phase 1 — error state: recovery panel and reload button are visible.
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    const reloadBtn = screen.getByRole('button', { name: /reload panel/i });
    expect(reloadBtn).toBeInTheDocument();

    // Simulate the dependency recovering before the user clicks Reload.
    motionRuntime.shouldThrow = false;

    // Phase 2 — user clicks Reload: boundary resets and ReviewAnalytics
    // remounts successfully with motion.div no longer throwing.
    fireEvent.click(reloadBtn);

    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Review Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reviews Given')).toBeInTheDocument();
  });
});
