/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useState } from 'react';
import { useDebounce } from './useDebounce';

// Mock Telemetry Logger
const mockTelemetryTracker = vi.fn();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    mockTelemetryTracker(error.message);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        null,
        this.props.fallback,
        React.createElement('button', { onClick: this.reset }, 'Reset / Reload')
      );
    }
    return this.props.children;
  }
}

const TestComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  const [val, setVal] = useState('test_string');
  const debounced = useDebounce(val, 500);

  if (shouldThrow) {
    throw new Error('Database connectivity error or unexpected runtime exception!');
  }

  return React.createElement(
    'div',
    null,
    React.createElement('span', null, debounced as React.ReactNode),
    React.createElement('button', { onClick: () => setVal('changed') }, 'Change')
  );
};

describe('Hydration Stability, Exception Safety & Error Fallbacks (Variation 6)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTelemetryTracker.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithBoundary = (shouldThrow = false) => {
    return render(
      React.createElement(
        ErrorBoundary,
        { fallback: React.createElement('div', null, 'Clean Error Recovery UI') },
        React.createElement(TestComponent, { shouldThrow })
      )
    );
  };

  it('mocks nested child properties to throw unexpected runtime exceptions or database connectivity errors', () => {
    renderWithBoundary(true);
    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      'Database connectivity error or unexpected runtime exception!'
    );
  });

  it('encases execution calls in localized boundary elements and handles exceptions gracefully', () => {
    expect(() => renderWithBoundary(true)).not.toThrow();
  });

  it('asserts that target modules render a clean error recovery UI instead of crashing the site', () => {
    renderWithBoundary(true);
    expect(screen.getByText('Clean Error Recovery UI')).toBeInTheDocument();
    expect(screen.queryByText('test_string')).not.toBeInTheDocument();
  });

  it('verifies exceptions are logged to dev-telemetry trackers appropriately', () => {
    renderWithBoundary(true);
    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled(); // React logs to console.error when a boundary catches
  });

  it('ensures user reset/reload paths are available on the recovery panels', () => {
    const { rerender } = renderWithBoundary(true);

    // Verify reset button is visible
    const resetButton = screen.getByRole('button', { name: 'Reset / Reload' });
    expect(resetButton).toBeInTheDocument();

    // Simulate fixing the underlying issue and pressing reset
    rerender(
      React.createElement(
        ErrorBoundary,
        { fallback: React.createElement('div', null, 'Clean Error Recovery UI') },
        React.createElement(TestComponent, { shouldThrow: false })
      )
    );
    fireEvent.click(resetButton);

    // UI should recover
    expect(screen.getByText('test_string')).toBeInTheDocument();
    expect(screen.queryByText('Clean Error Recovery UI')).not.toBeInTheDocument();
  });
});
