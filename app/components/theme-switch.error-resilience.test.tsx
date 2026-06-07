import React, { type ErrorInfo } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeToggleButton, createAnimation } from './theme-switch';

type ErrorBoundaryProps = React.PropsWithChildren<{
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
}>;

interface ErrorBoundaryState {
  hasError: boolean;
}

class TestErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Error recovery panel</p>
          <button onClick={this.handleReset}>Try again</button>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

describe('ThemeSwitch error resilience', () => {
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;
  let originalCreateElement: Document['createElement'];

  beforeEach(() => {
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;
    originalCreateElement = document.createElement.bind(document);

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });

    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
  });

  it('renders ThemeToggleButton without crashing and shows placeholder before hydration', () => {
    render(
      <TestErrorBoundary>
        <ThemeToggleButton />
      </TestErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeTruthy();
  });

  it('recovers gracefully when localStorage throws during initial theme resolution', () => {
    const errorSpy = vi.fn();
    const mockStorage = {
      getItem: vi.fn(() => {
        throw new Error('LocalStorage unavailable');
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: mockStorage,
    });

    render(
      <TestErrorBoundary onError={errorSpy}>
        <ThemeToggleButton />
      </TestErrorBoundary>
    );

    expect(errorSpy).toHaveBeenCalled();
    expect(screen.getByText(/Error recovery panel/i)).toBeTruthy();
  });

  it('allows the error recovery panel reset button to restore the UI', async () => {
    const errorSpy = vi.fn();
    const resetSpy = vi.fn();
    const mockStorage = {
      getItem: vi.fn(() => {
        throw new Error('LocalStorage unavailable');
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: mockStorage,
    });

    render(
      <TestErrorBoundary onError={errorSpy} onReset={resetSpy}>
        <ThemeToggleButton />
      </TestErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(resetButton);

    expect(resetSpy).toHaveBeenCalled();
  });

  it('generates a safe animation object for circle variant without throwing', () => {
    const animation = createAnimation('circle', 'center', true, 'https://example.com/test.gif');

    expect(animation).toBeDefined();
    expect(animation.name).toContain('circle-center-blur');
    expect(animation.css).toContain('animation-duration');
  });
});
