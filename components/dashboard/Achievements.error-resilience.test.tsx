import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Achievement } from '@/types/dashboard';

const flags = vi.hoisted(() => ({
  shouldThrowChildIcon: false,
  shouldFailDatabase: false,
  shouldThrowHydration: false,
}));

const mockTelemetry = vi.hoisted(() => vi.fn());
const mockGetAchievementsFromDatabase = vi.hoisted(() => vi.fn());

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children?: ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => {
      const safeProps = { ...props };
      delete safeProps.initial;
      delete safeProps.whileInView;
      delete safeProps.viewport;
      delete safeProps.transition;
      return (
        <div className={className} {...safeProps}>
          {children}
        </div>
      );
    },
  },
}));

vi.mock('lucide-react', () => ({
  Trophy: (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" {...props} />,
  Flame: (props: React.SVGProps<SVGSVGElement>) => {
    if (flags.shouldThrowChildIcon) {
      throw new Error('Unexpected runtime exception');
    }
    return <svg aria-hidden="true" {...props} />;
  },
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" {...props} />,
}));

import Achievements from './Achievements';

const validAchievements: Achievement[] = [
  {
    id: 'streak-1',
    title: 'Streak Starter',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    type: 'streak',
    isUnlocked: true,
    currentValue: 7,
    threshold: 7,
    progress: 100,
  },
  {
    id: 'contrib-1',
    title: 'First Commit',
    description: 'Made your first contribution',
    icon: '🏆',
    type: 'contributions',
    isUnlocked: true,
    currentValue: 1,
    threshold: 1,
    progress: 100,
  },
];

class TestErrorBoundary extends Component<
  {
    children: ReactNode;
    onReset?: () => void;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode;
    onReset?: () => void;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    mockTelemetry(error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" data-testid="error-recovery-panel">
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
          <button type="button" onClick={this.handleReset}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AchievementsDataGateway({ retryToken }: { retryToken: number }) {
  const [phase, setPhase] = React.useState<'loading' | 'error' | 'success'>('loading');
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);

  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const result = mockGetAchievementsFromDatabase();
        setAchievements(result);
        setPhase('success');
      } catch (error) {
        mockTelemetry(error as Error, { componentStack: '' });
        setPhase('error');
      }
    });
  }, [retryToken]);

  if (phase === 'error') {
    return (
      <div role="alert" data-testid="data-error-state">
        <p>We could not load your achievements. Database connection failed.</p>
        <button type="button" onClick={() => setPhase('loading')}>
          Retry
        </button>
      </div>
    );
  }

  if (phase === 'success') {
    return <Achievements achievements={achievements} />;
  }

  return <p>Loading achievements...</p>;
}

function HydrationStabilitySimulator() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => setIsClient(true));
  }, []);

  const serverAchievements = validAchievements.slice(0, 1);
  const clientAchievements: Achievement[] = [
    ...serverAchievements,
    {
      id: 'hydration-extra',
      title: 'Client-only Achievement',
      description: 'Only present after hydration',
      icon: '✨',
      type: 'behavior',
      isUnlocked: false,
      currentValue: 0,
      threshold: 10,
      progress: 0,
    },
  ];

  if (isClient && flags.shouldThrowHydration) {
    throw new Error('Hydration mismatch detected');
  }

  const data = isClient ? clientAchievements : serverAchievements;
  return <Achievements achievements={data} />;
}

describe('Achievements - Error Resilience', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTelemetry.mockClear();
    mockGetAchievementsFromDatabase.mockReset();
    flags.shouldThrowChildIcon = false;
    flags.shouldFailDatabase = false;
    flags.shouldThrowHydration = false;

    mockGetAchievementsFromDatabase.mockImplementation(() => {
      if (flags.shouldFailDatabase) {
        throw new Error('Database connection failed');
      }
      return validAchievements;
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    flags.shouldThrowChildIcon = false;
    flags.shouldFailDatabase = false;
    flags.shouldThrowHydration = false;
  });

  it('Test 1: catches runtime child component failure and renders recovery fallback UI', async () => {
    flags.shouldThrowChildIcon = true;

    expect(() => {
      render(
        <TestErrorBoundary>
          <Achievements achievements={validAchievements} />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Unexpected runtime exception')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByText('Streak Starter')).not.toBeInTheDocument();
  });

  it('Test 2: surfaces database/service failure as a user-facing error state instead of crashing', async () => {
    flags.shouldFailDatabase = true;

    render(<AchievementsDataGateway retryToken={0} />);

    const errorState = await screen.findByTestId('data-error-state');
    expect(errorState).toBeInTheDocument();
    expect(
      screen.getByText(/we could not load your achievements\. database connection failed\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByText('Streak Starter')).not.toBeInTheDocument();
    expect(mockTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Database connection failed' }),
      expect.any(Object)
    );
  });

  it('Test 3: maintains hydration stability and shows fallback UI when client data is inconsistent', async () => {
    flags.shouldThrowHydration = true;

    expect(() => {
      render(
        <TestErrorBoundary>
          <HydrationStabilitySimulator />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Hydration mismatch detected')).toBeInTheDocument();
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
  });

  it('Test 4: logs unexpected exceptions to the telemetry tracker with correct error details', async () => {
    flags.shouldThrowChildIcon = true;

    render(
      <TestErrorBoundary>
        <Achievements achievements={validAchievements} />
      </TestErrorBoundary>
    );

    await screen.findByRole('alert');

    expect(mockTelemetry).toHaveBeenCalled();
    const [loggedError, errorInfo] = mockTelemetry.mock.calls[0];
    expect(loggedError).toBeInstanceOf(Error);
    expect((loggedError as Error).message).toBe('Unexpected runtime exception');
    expect(errorInfo).toEqual(expect.objectContaining({ componentStack: expect.any(String) }));
  });

  it('Test 5: exposes a recovery action that resets the error boundary and restores Achievements', async () => {
    flags.shouldThrowChildIcon = true;
    const onReset = vi.fn();

    const { rerender } = render(
      <TestErrorBoundary onReset={onReset}>
        <Achievements achievements={validAchievements} />
      </TestErrorBoundary>
    );

    await screen.findByRole('alert');
    expect(screen.getByText('Unexpected runtime exception')).toBeInTheDocument();

    flags.shouldThrowChildIcon = false;
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(onReset).toHaveBeenCalledTimes(1);

    rerender(
      <TestErrorBoundary onReset={onReset}>
        <Achievements achievements={validAchievements} />
      </TestErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Streak Starter')).toBeInTheDocument();
  });
});
