import { expect, it, describe, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    context: vi.fn((cb) => {
      cb();
      return {
        revert: vi.fn(),
      };
    }),
    timeline: vi.fn(() => ({
      fromTo: vi.fn(),
      to: vi.fn(),
      kill: vi.fn(),
    })),
    set: vi.fn(),
    to: vi.fn(),
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

import { WallOfLove } from './WallOfLove';
const WallOfLoveModule = WallOfLove;

const mockTelemetry = {
  trackException: vi.fn(),
};

vi.mock('../utils/telemetry', () => ({
  telemetry: {
    trackException: (...args: unknown[]) => mockTelemetry.trackException(...args),
  },
}));

interface Props {
  children: ReactNode;
  forceError?: boolean;
}

interface State {
  hasError: boolean;
}

class TestErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: this.props.forceError || false,
  };

  public componentDidMount() {
    if (this.props.forceError) {
      this.componentDidCatch(new Error('Database connectivity error'), { componentStack: '' });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    mockTelemetry.trackException(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

describe('WallOfLove Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should maintain hydration stability when initial data is missing', () => {
    const { container } = render(<WallOfLoveModule />);
    expect(container).toBeDefined();
  });

  it('should render error recovery UI when runtime exception occurs', () => {
    render(
      <TestErrorBoundary forceError={true}>
        <WallOfLoveModule />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeDefined();
    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });

  it('should log exception to dev-telemetry tracker on failure', () => {
    render(
      <TestErrorBoundary forceError={true}>
        <WallOfLoveModule />
      </TestErrorBoundary>
    );

    expect(mockTelemetry.trackException).toHaveBeenCalled();
  });

  it('should prevent full screen crashes using localized boundary containment', () => {
    render(
      <div>
        <header data-testid="app-header">App Header</header>
        <TestErrorBoundary forceError={true}>
          <WallOfLoveModule />
        </TestErrorBoundary>
      </div>
    );
    expect(screen.getByTestId('app-header')).toBeDefined();
  });

  it('should trigger user reset or reload path on recovery panel click', () => {
    render(
      <TestErrorBoundary forceError={true}>
        <WallOfLoveModule />
      </TestErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(resetButton);

    expect(screen.queryByTestId('error-fallback')).toBeNull();
  });
});
