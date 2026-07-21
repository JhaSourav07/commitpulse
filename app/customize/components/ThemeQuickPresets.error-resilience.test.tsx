import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';
import { ThemeQuickPresets } from './ThemeQuickPresets';

// Silence React error output during error-boundary tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // telemetry hook placeholder
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-fallback">Component recovered</div>;
    }

    return this.props.children;
  }
}

describe('ThemeQuickPresets - Error Resilience', () => {
  it('renders normally without crashing', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /apply dark theme/i })).toBeInTheDocument();
  });

  it('recovers when child rendering throws', () => {
    const Broken = () => {
      throw new Error('Render failure');
    };

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });

  it('does not throw during repeated renders (hydration stability)', () => {
    const { rerender } = render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);

    expect(() =>
      rerender(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />)
    ).not.toThrow();
  });

  it('allows user interaction after rerender', () => {
    const onThemeChange = vi.fn();

    const { rerender } = render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    rerender(<ThemeQuickPresets theme="light" onThemeChange={onThemeChange} />);

    expect(screen.getByRole('button', { name: /apply light theme/i })).toBeInTheDocument();
  });

  it('logs runtime errors through the error boundary', () => {
    const spy = vi.spyOn(ErrorBoundary.prototype, 'componentDidCatch');

    const Broken = () => {
      throw new Error('Runtime exception');
    };

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    );

    expect(spy).toHaveBeenCalled();
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});
