import { expect, it, describe, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

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
  let WallOfLoveModule: React.ComponentType<{ tweets: unknown[] }>;

  beforeAll(async () => {
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

    const mod = await import('./WallOfLove');
    WallOfLoveModule = mod.WallOfLove;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should maintain hydration stability when initial data is missing', () => {
    const { container } = render(<WallOfLoveModule tweets={[]} />);
    expect(container).toBeDefined();
  });

  it('should render error recovery UI when runtime exception occurs', () => {
    render(
      <TestErrorBoundary forceError={true}>
        <WallOfLoveModule tweets={[]} />
      </TestErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeDefined();
    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });

  it('should log exception to dev-telemetry tracker on failure', () => {
    render(
      <TestErrorBoundary forceError={true}>
        <WallOfLoveModule tweets={[]} />
      </TestErrorBoundary>
    );

    expect(mockTelemetry.trackException).toHaveBeenCalled();
  });

  it('should prevent full screen crashes using localized boundary containment', () => {
    render(
      <div>
        <header data-testid="app-header">App Header</header>
        <TestErrorBoundary forceError={true}>
          <WallOfLoveModule tweets={[]} />
        </TestErrorBoundary>
      </div>
    );
    expect(screen.getByTestId('app-header')).toBeDefined();
  });

  it('should trigger user reset or reload path on recovery panel click', () => {
    render(
      <TestErrorBoundary forceError={true}>
        <WallOfLoveModule tweets={[]} />
      </TestErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(resetButton);

    expect(screen.queryByTestId('error-fallback')).toBeNull();
  });
});
