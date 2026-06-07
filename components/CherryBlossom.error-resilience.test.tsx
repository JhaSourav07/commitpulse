import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CherryBlossom from './CherryBlossom';

const motionRuntime = vi.hoisted(() => ({
  shouldThrow: false,
  errorMessage: 'Animation service interruption',
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
      if (motionRuntime.shouldThrow) {
        throw new Error(motionRuntime.errorMessage);
      }

      return (
        <div data-testid="falling-petal" {...props}>
          {children}
        </div>
      );
    },
  },
}));

interface BoundaryProps {
  children: ReactNode;
  onTelemetry?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface BoundaryState {
  error: Error | null;
}

class LocalErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onTelemetry?.(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <section role="alert" data-testid="cherry-blossom-error-fallback">
          <h2>Cherry blossom background paused</h2>
          <p>Decorative animation is temporarily unavailable.</p>
          <button type="button" onClick={() => this.setState({ error: null })}>
            Reload animation
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

describe('CherryBlossom — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    motionRuntime.shouldThrow = false;
    motionRuntime.errorMessage = 'Animation service interruption';
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    vi.clearAllMocks();
  });

  it('renders an empty server shell to keep hydration stable', () => {
    const html = renderToString(<CherryBlossom />);

    expect(html).toBe('');
  });

  it('renders petals after client hydration without crashing', async () => {
    render(
      <LocalErrorBoundary>
        <CherryBlossom />
      </LocalErrorBoundary>
    );

    const petals = await screen.findAllByTestId('falling-petal');

    expect(petals).toHaveLength(25);
    expect(screen.queryByTestId('cherry-blossom-error-fallback')).not.toBeInTheDocument();
  });

  it('renders a clean recovery panel when the nested animation runtime throws', () => {
    const telemetry = vi.fn();
    motionRuntime.shouldThrow = true;
    motionRuntime.errorMessage = 'Unexpected background service interruption';

    render(
      <LocalErrorBoundary onTelemetry={telemetry}>
        <CherryBlossom />
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('cherry-blossom-error-fallback')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Cherry blossom background paused');
    expect(screen.getByRole('button', { name: /reload animation/i })).toBeInTheDocument();
  });

  it('logs database-style runtime exceptions to dev telemetry', () => {
    const telemetry = vi.fn();
    motionRuntime.shouldThrow = true;
    motionRuntime.errorMessage = 'Database connectivity error while resolving blossom metadata';

    render(
      <LocalErrorBoundary onTelemetry={telemetry}>
        <CherryBlossom />
      </LocalErrorBoundary>
    );

    expect(telemetry).toHaveBeenCalledOnce();
    expect(telemetry.mock.calls[0][0].message).toBe(
      'Database connectivity error while resolving blossom metadata'
    );
    expect(telemetry.mock.calls[0][1].componentStack).toContain('CherryBlossom');
  });

  it('allows the user to reset the fallback after the animation dependency recovers', async () => {
    motionRuntime.shouldThrow = true;

    render(
      <LocalErrorBoundary>
        <CherryBlossom />
      </LocalErrorBoundary>
    );

    expect(screen.getByTestId('cherry-blossom-error-fallback')).toBeInTheDocument();

    motionRuntime.shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /reload animation/i }));

    const petals = await screen.findAllByTestId('falling-petal');

    expect(petals).toHaveLength(25);
    expect(screen.queryByTestId('cherry-blossom-error-fallback')).not.toBeInTheDocument();
  });
});
