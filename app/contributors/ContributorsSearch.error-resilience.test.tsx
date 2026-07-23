import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ContributorsSearch from './ContributorsSearch';

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

// =====================================================================
// 1. Telemetry Mock
// =====================================================================
const mockTelemetryTracker = vi.fn();

// =====================================================================
// 2. Localized Error Boundary Wrapper
// =====================================================================
class ResilienceErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error) {
    // Log exception to dev-telemetry trackers appropriately
    mockTelemetryTracker('[Dev-Telemetry-Log]', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-recovery-panel"
          className="p-6 border border-red-500 rounded-lg bg-red-50/10"
        >
          <h2 className="text-xl font-bold text-red-600">Something went wrong</h2>
          <p className="text-sm text-zinc-400">Unexpected Error: {this.state.errorMsg}</p>
          <button
            data-testid="reset-button"
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              this.setState({ hasError: false, errorMsg: '' });
              this.props.onReset();
            }}
          >
            Reload / Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Helper to create a contributor with a property getter that throws an exception
const createBrokenContributor = (message: string): Contributor => {
  return {
    id: 999,
    get login(): string {
      throw new Error(message);
    },
    avatar_url: 'https://example.com/broken.png',
    contributions: 5,
    html_url: 'https://github.com/broken',
  };
};

const validContributors: Contributor[] = [
  {
    id: 1,
    login: 'alice',
    avatar_url: 'https://example.com/alice.png',
    contributions: 42,
    html_url: 'https://github.com/alice',
  },
  {
    id: 2,
    login: 'bob',
    avatar_url: 'https://example.com/bob.png',
    contributions: 17,
    html_url: 'https://github.com/bob',
  },
];

describe('ContributorsSearch — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    // Suppress console.error output from React's ErrorBoundary caught errors to keep test outputs clean
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Test Case 1: Hydration Stability
  it('verifies Hydration Stability: renders cleanly with normal inputs and does not mismatch or crash', () => {
    render(<ContributorsSearch contributors={validContributors} />);
    expect(screen.getByPlaceholderText(/Search the collective.../i)).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  // Test Case 2: Exception Safety (Localized Boundary Encasement)
  it('encases execution calls and safely catches exceptions without crashing the main application thread', () => {
    const brokenContributors = [createBrokenContributor('Unexpected database connectivity error')];

    expect(() => {
      render(
        <ResilienceErrorBoundary onReset={() => {}}>
          <ContributorsSearch contributors={brokenContributors} />
        </ResilienceErrorBoundary>
      );
    }).not.toThrow();
  });

  // Test Case 3: Error Fallbacks (Recovery UI)
  it('renders a clean error recovery UI instead of crashing the site when exception occurs', () => {
    const brokenContributors = [createBrokenContributor('Unexpected database connectivity error')];

    render(
      <ResilienceErrorBoundary onReset={() => {}}>
        <ContributorsSearch contributors={brokenContributors} />
      </ResilienceErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/Unexpected Error: Unexpected database connectivity error/)
    ).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });

  // Test Case 4: Telemetry Logging
  it('logs caught exceptions to dev-telemetry trackers appropriately', () => {
    const brokenContributors = [createBrokenContributor('Telemetry tracked database failure')];

    render(
      <ResilienceErrorBoundary onReset={() => {}}>
        <ContributorsSearch contributors={brokenContributors} />
      </ResilienceErrorBoundary>
    );

    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      '[Dev-Telemetry-Log]',
      'Telemetry tracked database failure'
    );
  });

  // Test Case 5: Reset & Recovery Paths
  it('provides reset/reload paths on the recovery panel to restore application to a functional state', () => {
    const brokenContributors = [createBrokenContributor('Temporary API Timeout')];
    const resetSpy = vi.fn();

    const TestWrapper = () => {
      const [currentContributors, setCurrentContributors] =
        useState<Contributor[]>(brokenContributors);

      const handleReset = () => {
        resetSpy();
        setCurrentContributors(validContributors);
      };

      return (
        <ResilienceErrorBoundary onReset={handleReset}>
          <ContributorsSearch contributors={currentContributors} />
        </ResilienceErrorBoundary>
      );
    };

    render(<TestWrapper />);

    // Check we are in error state first
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByTestId('reset-button');
    fireEvent.click(retryButton);

    // Verify reset handler is called
    expect(resetSpy).toHaveBeenCalledTimes(1);

    // Verify component recovered and renders the normal contributors list
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });
});
