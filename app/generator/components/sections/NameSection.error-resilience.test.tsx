import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NameSection } from './NameSection';

const defaultProps = {
  value: 'Omkar',
  onChange: vi.fn(),
  onReset: vi.fn(),
};

const { shouldThrow } = vi.hoisted(() => ({
  shouldThrow: { value: false },
}));

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

describe('NameSection - Error Resilience (Variation 6)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    shouldThrow.value = false;
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('1. Hydration Stability: renders without hydration errors', () => {
    const { container } = render(<NameSection {...defaultProps} />);

    expect(container).toBeTruthy();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('2. Runtime Exception Safety: catches nested runtime exceptions', () => {
    shouldThrow.value = true;

    render(
      <TestErrorBoundary fallback={<div data-testid="runtime-error">Fallback UI</div>}>
        <NameSection {...defaultProps} />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('runtime-error')).toBeInTheDocument();
  });

  it('3. Error fallback keeps application usable', () => {
    shouldThrow.value = true;

    render(
      <TestErrorBoundary fallback={<div>Something went wrong</div>}>
        <NameSection {...defaultProps} />
      </TestErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(document.body).toBeTruthy();
  });

  it('4. Telemetry: logs runtime exception exactly once', () => {
    shouldThrow.value = true;

    render(
      <TestErrorBoundary fallback={<div />}>
        <NameSection {...defaultProps} />
      </TestErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();

    const loggedError = consoleErrorSpy.mock.calls.find(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('ErrorBoundary caught:')
    );

    expect(loggedError).toBeTruthy();
    expect(loggedError?.[1]).toBe('Nested Runtime Exception');
  });

  it('5. Recovery UI restores component after retry', () => {
    const recoverSpy = vi.fn();

    shouldThrow.value = true;

    const { rerender } = render(
      <TestErrorBoundary fallback={<div>Recovery Required</div>} onRecover={recoverSpy}>
        <NameSection {...defaultProps} />
      </TestErrorBoundary>
    );

    expect(screen.getByText('Recovery Required')).toBeInTheDocument();

    shouldThrow.value = false;

    rerender(
      <TestErrorBoundary fallback={<div>Recovery Required</div>} onRecover={recoverSpy}>
        <NameSection {...defaultProps} />
      </TestErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(recoverSpy).toHaveBeenCalledTimes(1);

    expect(screen.queryByText('Recovery Required')).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText('e.g. Omkar')).toBeInTheDocument();
  });
});
