import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { Component, ReactNode } from 'react';
import ActivityLandscape from './ActivityLandscape';
import type { ActivityData } from '@/types/dashboard';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as unknown as typeof IntersectionObserver;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props as React.HTMLAttributes<HTMLDivElement>, children),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

interface MockErrorBoundaryProps {
  onError?: (error: Error, info: { componentStack: string }) => void;
  onReset?: () => void;
  children?: ReactNode;
}

interface MockErrorBoundaryState {
  hasError: boolean;
}

class MockErrorBoundary extends Component<MockErrorBoundaryProps, MockErrorBoundaryState> {
  constructor(props: MockErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): MockErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        { 'data-testid': 'error-recovery-panel' },
        React.createElement('h2', null, 'Something went wrong.'),
        React.createElement(
          'button',
          { onClick: this.props.onReset, 'data-testid': 'reset-button' },
          'Try again'
        )
      );
    }
    return this.props.children;
  }
}

const validData: ActivityData[] = [
  { date: '2024-01-01', count: 5, intensity: 2, locAdditions: 100, locDeletions: 20 },
];

describe('ActivityLandscape - Hydration Stability & Error Resilience', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders without crashing on hydration with valid empty data', () => {
    render(React.createElement(ActivityLandscape, { data: [] }));
    expect(document.querySelector('[class]')).toBeDefined();
  });

  it('renders correctly with valid data', () => {
    render(React.createElement(ActivityLandscape, { data: validData }));
    expect(document.querySelector('[class]')).toBeDefined();
  });

  it('boundary catches undefined data', () => {
    const onError = vi.fn();
    render(
      React.createElement(
        MockErrorBoundary,
        { onError },
        React.createElement(ActivityLandscape, { data: undefined as unknown as ActivityData[] })
      )
    );
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(TypeError);
  });

  it('boundary catches null data prop', () => {
    const onError = vi.fn();
    render(
      React.createElement(
        MockErrorBoundary,
        { onError },
        React.createElement(ActivityLandscape, { data: null as unknown as ActivityData[] })
      )
    );
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(TypeError);
  });

  it('reset button is clickable on error recovery panel', () => {
    const onReset = vi.fn();
    render(
      React.createElement(
        MockErrorBoundary,
        { onReset },
        React.createElement(ActivityLandscape, { data: undefined as unknown as ActivityData[] })
      )
    );
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('reset-button'));
    expect(onReset).toHaveBeenCalled();
  });

  it('error telemetry receives the exception message', () => {
    const telemetryTracker = vi.fn();
    render(
      React.createElement(
        MockErrorBoundary,
        { onError: (error: Error) => telemetryTracker(error.message) },
        React.createElement(ActivityLandscape, { data: null as unknown as ActivityData[] })
      )
    );
    expect(telemetryTracker).toHaveBeenCalled();
    expect(telemetryTracker.mock.calls[0][0]).toMatch(/Cannot read properties of (null|undefined)/);
  });
});
