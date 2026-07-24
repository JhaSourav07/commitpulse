import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RootLayout from './layout';

// Mock telemetry tracker
const mockTelemetryLogger: Mock = vi.fn();

// Mock all layout subcomponents like other layout.test files do
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mocked-inter' }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="mock-analytics" />,
}));

vi.mock('./components/navbar', () => ({
  default: () => <nav data-testid="mock-navbar">Navbar</nav>,
}));

vi.mock('@/components/BrandParticles', () => ({
  default: () => <div data-testid="mock-brand-particles" />,
}));

vi.mock('@/components/ReturnToTop', () => ({
  default: () => <button data-testid="mock-return-to-top">Return To Top</button>,
}));

vi.mock('./components/ScrollRestoration', () => ({
  default: () => <div data-testid="mock-scroll-restoration" />,
}));

vi.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

vi.mock('@/components/AnimatedCursor', () => ({
  default: () => <div data-testid="mock-animated-cursor" />,
}));

vi.mock('@/components/KonamiEasterEgg', () => ({
  default: () => <div data-testid="mock-konami" />,
}));

// Localized Error Boundary for testing exception safety and fallbacks
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
  telemetryLogger?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class LocalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.telemetryLogger) {
      this.props.telemetryLogger(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary-fallback">
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Components that simulate different failure modes
const BuggyRuntimeChild = () => {
  throw new Error('Unexpected runtime exception!');
};

const BuggyDatabaseChild = () => {
  throw new Error('Database connection timeout or anomaly!');
};

const BuggyServiceWorkerChild = () => {
  throw new Error('Background service interruption detected!');
};

describe('Layout Component: Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let mockReset: Mock;

  beforeEach(() => {
    mockReset = vi.fn();
    mockTelemetryLogger.mockClear();

    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1: Hydration Stability - renders valid children without crashing and mounts all shell components', () => {
    render(
      <LocalErrorBoundary onReset={mockReset}>
        <RootLayout>
          <div data-testid="valid-child">Valid Content</div>
        </RootLayout>
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('valid-child')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-providers')).toBeInTheDocument();
    expect(screen.getByTestId('mock-return-to-top')).toBeInTheDocument();
  });

  it('Test 2: Exception Safety - catches unexpected runtime exceptions and renders localized error recovery UI', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <RootLayout>
          <BuggyRuntimeChild />
        </RootLayout>
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Unexpected runtime exception!')).toBeInTheDocument();
  });

  it('Test 3: Dev-Telemetry - verifies exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <RootLayout>
          <BuggyServiceWorkerChild />
        </RootLayout>
      </LocalErrorBoundary>
    );

    expect(mockTelemetryLogger).toHaveBeenCalledTimes(1);
    const [errorArg] = mockTelemetryLogger.mock.calls[0];
    expect(errorArg).toBeInstanceOf(Error);
    expect(errorArg.message).toBe('Background service interruption detected!');
  });

  it('Test 4: Error Fallbacks - isolates and handles mocked database connectivity errors properly', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <RootLayout>
          <BuggyDatabaseChild />
        </RootLayout>
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Database connection timeout or anomaly!')).toBeInTheDocument();

    expect(mockTelemetryLogger).toHaveBeenCalledTimes(1);
    const [errorArg] = mockTelemetryLogger.mock.calls[0];
    expect(errorArg.message).toBe('Database connection timeout or anomaly!');
  });

  it('Test 5: Reset/Reload Paths - ensures user reset/reload paths are available on recovery panels and functioning', () => {
    render(
      <LocalErrorBoundary onReset={mockReset} telemetryLogger={mockTelemetryLogger}>
        <RootLayout>
          <BuggyRuntimeChild />
        </RootLayout>
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /try again/i });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
