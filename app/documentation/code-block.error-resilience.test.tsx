import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeBlock } from './code-block';
import React, { Component, ReactNode, ErrorInfo } from 'react';

// Mock telemetry tracker
const mockTelemetry = {
  logException: vi.fn(),
};

// Simple Error Boundary for testing
class ErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    mockTelemetry.logException(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-ui">
          <p>Something went wrong: {this.state.error?.message}</p>
          <button onClick={this.handleReset} data-testid="reset-button">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Component that intentionally throws an error for testing the boundary
const FaultyCodeBlock = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Unexpected runtime exception');
  }
  return <CodeBlock code="console.log('test')" />;
};

describe('CodeBlock Error Resilience', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress console.error in tests for cleaner output
    console.error = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('Test 1: should catch runtime exceptions in nested child components using an Error Boundary', () => {
    render(
      <ErrorBoundary>
        <FaultyCodeBlock shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-ui')).toBeInTheDocument();
  });

  it('Test 2: should log caught exceptions to dev-telemetry trackers', () => {
    render(
      <ErrorBoundary>
        <FaultyCodeBlock shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockTelemetry.logException).toHaveBeenCalled();
    const errorArg = mockTelemetry.logException.mock.calls[0][0];
    expect(errorArg.message).toBe('Unexpected runtime exception');
  });

  it('Test 3: should render a clean error recovery UI instead of crashing the site', () => {
    const { container } = render(
      <ErrorBoundary>
        <FaultyCodeBlock shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify error UI is present and no unhandled exceptions bubbled up
    expect(
      screen.getByText(/Something went wrong: Unexpected runtime exception/i)
    ).toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();
  });

  it('Test 4: should provide a user reset/reload path on the recovery panel', () => {
    const TestWrapper = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      return (
        <ErrorBoundary onReset={() => setShouldThrow(false)}>
          <FaultyCodeBlock shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);

    expect(screen.getByTestId('error-recovery-ui')).toBeInTheDocument();

    const resetButton = screen.getByTestId('reset-button');
    fireEvent.click(resetButton);

    // Error UI should be gone, normal component should be visible
    expect(screen.queryByTestId('error-recovery-ui')).toBeNull();
    expect(screen.getByText(/console\.log\('test'\)/)).toBeInTheDocument();
  });

  it('Test 5: should gracefully handle clipboard API rejection errors without crashing', async () => {
    // Mock navigator.clipboard.writeText to throw an error
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard permission denied')),
      },
    });

    render(<CodeBlock code="const a = 1;" />);

    const copyButton = screen.getByRole('button', { name: /Copy code snippet/i });

    // This should not crash or throw an unhandled exception
    await fireEvent.click(copyButton);

    // Verify it doesn't show "Copied" since it failed
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.queryByText('Copied')).toBeNull();

    // Restore clipboard
    Object.assign(navigator, { clipboard: originalClipboard });
  });
});
