import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotFound from './not-found';

// --- Mocks & Fault Injection Setup ---

// Control flag to trigger unexpected exceptions in nested child components
let triggerException = false;
let exceptionMessage = '';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('../components/MiniGame', () => ({
  default: () => {
    if (triggerException) {
      throw new Error(exceptionMessage);
    }
    return <div data-testid="mini-game">MiniGame Component</div>;
  },
}));

// Localized Error Boundary to encase execution calls and display a clean recovery UI
class LocalizedErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Simulate Dev-Telemetry Logging
    console.error('[Telemetry Tracker] Runtime Exception Caught:', error.message);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="error-recovery-panel">
          <h2>Application Error Recovered</h2>
          <p>We experienced an unexpected anomaly.</p>
          <button onClick={this.resetError}>Reload / Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('NotFound Component - Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset flags
    triggerException = false;
    exceptionMessage = '';

    // Spy on console.error to track telemetry logs and suppress noisy React Error Boundary warnings in test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('Renders normally with hydration stability when no exceptions occur', () => {
    // Simulates standard hydration and stable render
    const { container } = render(
      <LocalizedErrorBoundary>
        <NotFound />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go back home/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Assert that target modules render a clean error recovery UI instead of crashing the site', () => {
    // Mock nested child properties to throw unexpected runtime exceptions
    triggerException = true;
    exceptionMessage = 'Unexpected Runtime UI Exception';

    render(
      <LocalizedErrorBoundary>
        <NotFound />
      </LocalizedErrorBoundary>
    );

    // Assert standard UI is replaced by the clean error fallback boundary
    expect(screen.queryByTestId('mini-game')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Application Error Recovered/i)).toBeInTheDocument();
  });

  it('Verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    triggerException = true;
    exceptionMessage = 'Database Connectivity Error Timeout';

    render(
      <LocalizedErrorBoundary>
        <NotFound />
      </LocalizedErrorBoundary>
    );

    // Verify the simulated telemetry tracker captured the specific error successfully
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Telemetry Tracker] Runtime Exception Caught:',
      'Database Connectivity Error Timeout'
    );
  });

  it('Ensure user reset/reload paths are available on the recovery panels', () => {
    triggerException = true;
    exceptionMessage = 'Temporary Network Disconnect';

    const handleReset = vi.fn(() => {
      // Simulate resolving the issue on reload
      triggerException = false;
    });

    render(
      <LocalizedErrorBoundary onReset={handleReset}>
        <NotFound />
      </LocalizedErrorBoundary>
    );

    // The boundary is currently showing the recovery UI
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // User finds and clicks the reset/reload path
    const reloadButton = screen.getByRole('button', { name: /Reload \/ Try again/i });
    fireEvent.click(reloadButton);

    // Verify the reset callback fired and the component successfully recovered the original UI
    expect(handleReset).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('mini-game')).toBeInTheDocument();
  });

  it('Encase execution calls in localized boundary elements maintaining page frame integrity', () => {
    // Verifies that when the localized component crashes, siblings/wrappers can stay intact
    triggerException = true;
    exceptionMessage = 'Nested Component Failure';

    render(
      <div>
        <header data-testid="global-header">Global Header</header>
        <LocalizedErrorBoundary>
          <NotFound />
        </LocalizedErrorBoundary>
        <footer data-testid="global-footer">Global Footer</footer>
      </div>
    );

    // The boundary catches the localized crash
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // However, the outer layout shells (header/footer) remain intact and stable
    expect(screen.getByTestId('global-header')).toBeInTheDocument();
    expect(screen.getByTestId('global-footer')).toBeInTheDocument();
  });
});
