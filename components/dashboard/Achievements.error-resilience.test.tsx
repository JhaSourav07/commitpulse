import type { ComponentProps, ReactNode } from 'react';
import { Component } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Trophy } from 'lucide-react';
import Achievements from './Achievements';
import type { Achievement } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      'data-testid': testId,
    }: ComponentProps<'div'> & { [key: string]: unknown }) => (
      <div className={className} style={style} data-testid={testId as string}>
        {children}
      </div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  Trophy: vi.fn(() => null),
  Flame: vi.fn(() => null),
  Sparkles: vi.fn(() => null),
}));

interface ErrorBoundaryState {
  hasError: boolean;
}

class RecoverableErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback">
          <p>Something went wrong with the Achievements panel.</p>
          <button data-testid="retry-button" onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
          <button data-testid="reload-button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const sampleAchievements: Achievement[] = [
  {
    id: 'a1',
    title: 'First Commit',
    description: 'Made your first commit',
    icon: 'trophy',
    isUnlocked: true,
    type: 'contributions',
    threshold: 1,
    currentValue: 1,
    progress: 100,
  },
  {
    id: 'a2',
    title: '7-Day Streak',
    description: 'Committed 7 days in a row',
    icon: 'flame',
    isUnlocked: false,
    type: 'streak',
    threshold: 7,
    currentValue: 3,
    progress: 43,
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Achievements — error resilience', () => {
  it('renders inside an ErrorBoundary without triggering the fallback for valid data', () => {
    render(
      <RecoverableErrorBoundary>
        <Achievements achievements={sampleAchievements} />
      </RecoverableErrorBoundary>
    );
    expect(screen.queryByTestId('error-fallback')).toBeNull();
    expect(screen.getByText('First Commit')).toBeTruthy();
  });

  it('does not crash and suppresses the boundary fallback when achievements is an empty array', () => {
    render(
      <RecoverableErrorBoundary>
        <Achievements achievements={[]} />
      </RecoverableErrorBoundary>
    );
    expect(screen.queryByTestId('error-fallback')).toBeNull();
  });

  it('ErrorBoundary catches a nested render exception and shows a clean recovery UI without crashing the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(Trophy).mockImplementation(() => {
      throw new Error('Simulated icon render failure');
    });
    render(
      <RecoverableErrorBoundary>
        <Achievements achievements={sampleAchievements} />
      </RecoverableErrorBoundary>
    );
    expect(screen.getByTestId('error-fallback')).toBeTruthy();
    expect(screen.queryByText('First Commit')).toBeNull();
  });

  it('React logs the specific caught render exception to console.error for developer telemetry', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(Trophy).mockImplementation(() => {
      throw new Error('Simulated icon render failure');
    });
    render(
      <RecoverableErrorBoundary>
        <Achievements achievements={sampleAchievements} />
      </RecoverableErrorBoundary>
    );
    const logged = consoleSpy.mock.calls.some((args) =>
      args.some((arg) => arg instanceof Error && arg.message === 'Simulated icon render failure')
    );
    expect(logged).toBe(true);
  });

  it('retry action resets the boundary and reload action invokes window.location.reload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadMock = vi.fn();
    vi.stubGlobal('location', { reload: reloadMock });

    vi.mocked(Trophy).mockImplementation(() => {
      throw new Error('Simulated icon render failure');
    });
    render(
      <RecoverableErrorBoundary>
        <Achievements achievements={sampleAchievements} />
      </RecoverableErrorBoundary>
    );
    expect(screen.getByTestId('error-fallback')).toBeTruthy();

    // Reload action: verify window.location.reload is called.
    fireEvent.click(screen.getByTestId('reload-button'));
    expect(reloadMock).toHaveBeenCalledOnce();

    // Retry action: stop throwing so the boundary can re-render successfully.
    vi.mocked(Trophy).mockImplementation(() => null);
    fireEvent.click(screen.getByTestId('retry-button'));
    expect(screen.queryByTestId('error-fallback')).toBeNull();
    expect(screen.getByText('First Commit')).toBeTruthy();
  });
});
