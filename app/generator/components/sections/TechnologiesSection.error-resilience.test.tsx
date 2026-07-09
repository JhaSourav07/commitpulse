import React, { Component, type ReactNode, type ErrorInfo, type ComponentProps } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TechnologiesSection } from './TechnologiesSection';
import '@testing-library/jest-dom/vitest';

// Control flags to simulate exceptions
let shouldGetRecommendationsThrow = false;
let shouldSearchIconThrow = false;

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt = '', src, width, height, className, ...props }: ComponentProps<'img'>) => (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt={alt}
      src={src as string}
      width={width}
      height={height}
      className={className}
      {...props}
    />
  ),
}));

// Mock recommendationEngine to control errors
vi.mock('@/lib/graph/recommendationEngine', () => ({
  getRecommendations: vi.fn(() => {
    if (shouldGetRecommendationsThrow) {
      throw new Error('FATAL_DB_DISCONNECT: Database connection timed out');
    }
    // Return standard mock recommendations under normal conditions
    return [
      {
        id: 'react',
        name: 'React',
        category: 'Frontend',
        score: 95,
        strength: 'strong',
        reasons: ['Popular choices', 'High compatibility'],
      },
    ];
  }),
}));

// Mock lucide-react to test nested icon exception safety
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Search: () => {
      if (shouldSearchIconThrow) {
        throw new Error('Search icon rendering failed unexpectedly');
      }
      return <span data-testid="mock-search">SearchIcon</span>;
    },
  };
});

// A local boundary component for testing exception safety and telemetry logging
interface ErrorBoundaryProps {
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TestErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-panel" role="alert">
          <h3>System Alert</h3>
          <p>Unexpected exception: {this.state.error?.message}</p>
          <button onClick={this.handleReset} data-testid="reset-button">
            Reset and Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('TechnologiesSection Component - Error Resilience Tests', () => {
  const defaultProps = {
    selected: ['typescript'],
    onChange: vi.fn(),
  };

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    shouldGetRecommendationsThrow = false;
    shouldSearchIconThrow = false;
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('Case 1: Verify Hydration Stability by rendering normally without exceptions', () => {
    render(
      <TestErrorBoundary>
        <TechnologiesSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Verify main components are successfully mounted and present
    expect(screen.getByText('Technologies')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search technologies...')).toBeInTheDocument();
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
  });

  it('Case 2: Handles recommendation engine database connectivity exception safely in localized boundary', () => {
    shouldGetRecommendationsThrow = true;

    render(
      <TestErrorBoundary>
        <TechnologiesSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Verify recovery panel is displayed instead of crashing the application
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText(/FATAL_DB_DISCONNECT/i)).toBeInTheDocument();
    expect(screen.queryByText('Technologies')).not.toBeInTheDocument();
  });

  it('Case 3: Verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    const telemetryTracker = vi.fn();
    shouldGetRecommendationsThrow = true;

    render(
      <TestErrorBoundary onError={telemetryTracker}>
        <TechnologiesSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Assert the telemetry spy was invoked with the simulated error
    expect(telemetryTracker).toHaveBeenCalledTimes(1);
    const errorPassed = telemetryTracker.mock.calls[0][0];
    expect(errorPassed).toBeInstanceOf(Error);
    expect(errorPassed.message).toContain('FATAL_DB_DISCONNECT');
  });

  it('Case 4: Catches unexpected runtime exceptions inside nested child component (Search Icon) safely', () => {
    shouldSearchIconThrow = true;

    render(
      <TestErrorBoundary>
        <TechnologiesSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Verify recovery UI and no crash
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText(/Search icon rendering failed unexpectedly/i)).toBeInTheDocument();
  });

  it('Case 5: Ensure user reset/reload paths are available on the recovery panels and function correctly', () => {
    shouldGetRecommendationsThrow = true;

    render(
      <TestErrorBoundary>
        <TechnologiesSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Recovery UI displayed
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    // Resolve the error state
    shouldGetRecommendationsThrow = false;

    // Trigger recovery reset
    const resetButton = screen.getByTestId('reset-button');
    fireEvent.click(resetButton);

    // Verify clean render after reset
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Technologies')).toBeInTheDocument();
  });
});
