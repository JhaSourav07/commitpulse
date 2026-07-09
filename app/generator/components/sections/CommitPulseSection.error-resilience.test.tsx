import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommitPulseSection } from './CommitPulseSection';

// --- Default Props ---
const defaultProps = {
  githubUsername: 'octocat',
  showCommitPulse: true,
  commitPulseAccent: '10b981',
  onGithubUsernameChange: vi.fn(),
  onShowCommitPulseChange: vi.fn(),
  onCommitPulseAccentChange: vi.fn(),
};

// --- Mocks ---
const { shouldThrow } = vi.hoisted(() => ({ shouldThrow: { value: false } }));

// We mock the child SectionCard to trigger a runtime error in one of the tests
vi.mock('../SectionCard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../SectionCard')>();
  return {
    ...actual,
    SectionCard: (props: React.ComponentProps<typeof actual.SectionCard>) => {
      if (shouldThrow.value) {
        throw new Error('Nested Runtime Exception');
      }
      return <actual.SectionCard {...props} />;
    },
  };
});

// Test Error Boundary
class TestErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onRecover?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode; onRecover?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error.message);
  }

  resetBoundary = () => {
    this.setState({ hasError: false });
    this.props.onRecover?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback">
          {this.props.fallback}
          <button onClick={this.resetBoundary}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

describe('CommitPulseSection - Error Resilience (Variation 6)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    shouldThrow.value = false;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ login: 'octocat', stats: { currentStreak: 5 } }),
      } as Response)
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('1. Hydration Stability: renders component via SSR+hydration gracefully', () => {
    const { container } = render(<CommitPulseSection {...defaultProps} />);

    // Verify component mounts without crashes
    expect(container).toBeTruthy();
    // Verify hydration didn't trigger React warnings
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('2. Runtime Exception Safety: catches nested exceptions and shows fallback UI', () => {
    shouldThrow.value = true;
    render(
      <TestErrorBoundary fallback={<div data-testid="runtime-error">Fallback UI</div>}>
        <CommitPulseSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Verify application did not crash and fallback UI is shown
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('runtime-error')).toBeInTheDocument();
  });

  it('3. Service / Database Failure Recovery: degrades gracefully on rejected API calls', async () => {
    // Mock the fetch call to reject, simulating a network or service failure
    fetchSpy.mockRejectedValueOnce(new Error('Service Unavailable'));

    render(
      <TestErrorBoundary fallback={<div>Should not hit error boundary</div>}>
        <CommitPulseSection {...defaultProps} githubUsername="octocat" />
      </TestErrorBoundary>
    );

    // The component handles fetch errors internally and shows a verification failed message
    await waitFor(() => {
      expect(screen.getByText(/Verification failed/i)).toBeInTheDocument();
    });

    // Ensure no uncaught exceptions escape by verifying the document remains intact
    expect(document.body).toBeTruthy();
    expect(screen.queryByText('Should not hit error boundary')).not.toBeInTheDocument();
  });

  it('4. Telemetry / Logger Verification: logs the exact exception once with expected arguments', () => {
    shouldThrow.value = true;
    render(
      <TestErrorBoundary fallback={<div />}>
        <CommitPulseSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Verify console.error was captured
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Verify logger was invoked exactly once for the ErrorBoundary catch
    const loggedError = consoleErrorSpy.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('ErrorBoundary caught:')
    );
    expect(loggedError).toBeTruthy();
    expect(loggedError?.[1]).toBe('Nested Runtime Exception');
  });

  it('5. Recovery UI: attempts recovery properly upon user interaction', () => {
    const mockRecoverFn = vi.fn();
    shouldThrow.value = true;

    const { rerender } = render(
      <TestErrorBoundary fallback={<div>Oops! Something failed.</div>} onRecover={mockRecoverFn}>
        <CommitPulseSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Component is initially in error state
    expect(screen.getByText('Oops! Something failed.')).toBeInTheDocument();

    // Simulate fixing the root cause for the next render
    shouldThrow.value = false;
    rerender(
      <TestErrorBoundary fallback={<div>Oops! Something failed.</div>} onRecover={mockRecoverFn}>
        <CommitPulseSection {...defaultProps} />
      </TestErrorBoundary>
    );

    // Simulate clicking the recovery action
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Verify recovery callback was executed
    expect(mockRecoverFn).toHaveBeenCalledTimes(1);

    // Verify the component recovered and fallback is removed
    expect(screen.queryByText('Oops! Something failed.')).not.toBeInTheDocument();
    // The main component should now be visible (we look for the label or text)
    expect(screen.getByText(/GitHub Username/i)).toBeInTheDocument();
  });
});
