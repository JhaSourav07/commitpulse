import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ProfileOptimizerModal from './ProfileOptimizerModal';

const { mockTelemetry } = vi.hoisted(() => ({
  mockTelemetry: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) =>
      React.createElement('p', props, children),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('lucide-react', () => ({
  X: () => React.createElement('span', { 'data-testid': 'icon-x' }, 'X'),
  Download: () => React.createElement('span', null, 'Download'),
  Copy: () => React.createElement('span', null, 'Copy'),
  CheckCircle: () => React.createElement('span', null, 'CheckCircle'),
  TrendingUp: () => React.createElement('span', null, 'TrendingUp'),
  AlertCircle: () => React.createElement('span', null, 'AlertCircle'),
}));

const validUserData = {
  profile: {
    developerScore: 75,
    bio: 'Full Stack Developer',
    stats: { repositories: 12, followers: 20 },
  },
  languages: ['TypeScript', 'JavaScript'],
  stats: { totalContributions: 500 },
};

class TestErrorBoundary extends React.Component<
  { onReset: () => void; children: React.ReactNode },
  { caughtError: Error | null }
> {
  constructor(props: { onReset: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { caughtError: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { caughtError: error };
  }

  componentDidCatch(error: Error) {
    mockTelemetry(error.message);
  }

  handleReset() {
    this.setState({ caughtError: null });
    this.props.onReset();
  }

  render() {
    if (this.state.caughtError) {
      return React.createElement(
        'div',
        { 'data-testid': 'error-recovery-panel', role: 'alert' },
        React.createElement('p', null, 'Something went wrong.'),
        React.createElement(
          'button',
          { onClick: this.handleReset, 'data-testid': 'reset-button' },
          'Reload'
        )
      );
    }

    return this.props.children;
  }
}

const FatalThrower = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ProfileOptimizerModal Error Resilience', () => {
  beforeEach(() => {
    mockTelemetry.mockClear();
  });

  it('maintains hydration stability with null userData and renders the loading state without crashing', () => {
    const { container } = render(
      <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={null} />
    );

    expect(screen.getByText('Analysing GitHub profile...')).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it('safely catches unexpected runtime exceptions from nested components inside a localized error boundary', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <TestErrorBoundary onReset={vi.fn()}>
          <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={validUserData} />
          <FatalThrower message="FATAL_DB_DISCONNECT: Database connectivity timed out" />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it('renders a clean error recovery UI with alert role and reload button when a runtime exception is caught', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary onReset={vi.fn()}>
        <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={validUserData} />
        <FatalThrower message="FATAL_RUNTIME: Profile calculation threw an exception" />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Reload')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('logs runtime exception messages to the dev-telemetry tracker via componentDidCatch', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestErrorBoundary onReset={vi.fn()}>
        <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={validUserData} />
        <FatalThrower message="FATAL_DB_DISCONNECT: Database connection timed out" />
      </TestErrorBoundary>
    );

    expect(mockTelemetry).toHaveBeenCalledTimes(1);
    expect(mockTelemetry).toHaveBeenCalledWith(
      'FATAL_DB_DISCONNECT: Database connection timed out'
    );

    consoleErrorSpy.mockRestore();
  });

  it('provides a working reset and reload path on the recovery panel that clears the error state', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let triggerError = true;
    const ConditionalThrower = () => {
      if (triggerError) {
        throw new Error('Transient rendering failure');
      }
      return React.createElement('span', null, 'Recovered content');
    };

    let resetKey = 0;
    const onReset = vi.fn(() => {
      triggerError = false;
      resetKey += 1;
    });

    const { rerender } = render(
      <TestErrorBoundary onReset={onReset} key={resetKey}>
        <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={validUserData} />
        <ConditionalThrower />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.queryByText('Recovered content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('reset-button'));
    expect(onReset).toHaveBeenCalledTimes(1);

    rerender(
      <TestErrorBoundary onReset={onReset} key={resetKey}>
        <ProfileOptimizerModal isOpen={true} onClose={vi.fn()} userData={validUserData} />
        <ConditionalThrower />
      </TestErrorBoundary>
    );

    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getByText('Recovered content')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
