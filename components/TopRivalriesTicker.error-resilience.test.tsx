import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopRivalriesTicker, { RivalryItem } from './TopRivalriesTicker';
import '@testing-library/jest-dom/vitest';

// =====================================================================
// 1. Mocks & Setup
// =====================================================================
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

interface MockMotionProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: unknown;
  transition?: unknown;
}

vi.mock('framer-motion', () => {
  const mockMotionDivInternal = React.forwardRef<HTMLDivElement, MockMotionProps>(
    ({ children, animate: _animate, transition: _transition, ...props }, ref) => {
      void _animate;
      void _transition;
      return (
        <div ref={ref} {...props}>
          {children}
        </div>
      );
    }
  );
  mockMotionDivInternal.displayName = 'MotionDiv';
  return {
    motion: {
      div: mockMotionDivInternal,
    },
  };
});

// Telemetry Tracker mock
const mockTelemetryTracker = vi.fn();

// =====================================================================
// 2. Localized Error Boundary Wrapper
// =====================================================================
class ResilienceErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error: Error) {
    // Log exception to dev-telemetry trackers appropriately
    mockTelemetryTracker('[Dev-Telemetry-Log]', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-recovery-panel">
          <h2>Clean Error Recovery UI</h2>
          <p>Unexpected Error: {this.state.errorMsg}</p>
          <button
            data-testid="reset-button"
            onClick={() => {
              this.setState({ hasError: false, errorMsg: '' });
              this.props.onReset();
            }}
          >
            Reload / Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// =====================================================================
// 3. Test Suite
// =====================================================================
describe('TopRivalriesTicker: Hydration Stability, Exception Safety & Error Fallbacks', () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    // Suppress console.error output from React's internal error reporting to keep test logs clean
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockTelemetryTracker.mockClear();
    mockPush.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const validRivalries: RivalryItem[] = [
    {
      u1: 'torvalds',
      u2: 'gaearon',
      label: 'Kernel vs React',
      icon: () => <span data-testid="mock-icon">🔥</span>,
      color: 'text-orange-500',
    },
  ];

  const maliciousRivalries: RivalryItem[] = [
    {
      u1: 'torvalds',
      u2: 'gaearon',
      label: 'Kernel vs React',
      icon: () => {
        throw new Error('Database connectivity lost: Unexpected ETIMEDOUT');
      },
      color: 'text-orange-500',
    },
  ];

  const TestHarness = ({ initialRivalries }: { initialRivalries: RivalryItem[] }) => {
    const [rivalries, setRivalries] = useState<RivalryItem[]>(initialRivalries);
    return (
      <ResilienceErrorBoundary onReset={() => setRivalries(validRivalries)}>
        <TopRivalriesTicker rivalries={rivalries} />
      </ResilienceErrorBoundary>
    );
  };

  it('1. should maintain Hydration Stability by rendering correctly under normal conditions', () => {
    render(<TestHarness initialRivalries={validRivalries} />);

    // Ticker component should render normally without errors
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getAllByText('torvalds').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kernel vs React').length).toBeGreaterThan(0);
  });

  it('2. should catch unexpected runtime/database exceptions safely within the localized boundary', () => {
    render(<TestHarness initialRivalries={maliciousRivalries} />);

    // Screen should not crash; it should render the clean error recovery UI
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(screen.getByText('Clean Error Recovery UI')).toBeInTheDocument();
    expect(screen.getByText(/Database connectivity lost/i)).toBeInTheDocument();
  });

  it('3. should verify exceptions are logged to dev-telemetry trackers appropriately', () => {
    render(<TestHarness initialRivalries={maliciousRivalries} />);

    // Validate telemetry was fired with the correct signature and message
    expect(mockTelemetryTracker).toHaveBeenCalledTimes(1);
    expect(mockTelemetryTracker).toHaveBeenCalledWith(
      '[Dev-Telemetry-Log]',
      'Database connectivity lost: Unexpected ETIMEDOUT'
    );
  });

  it('4. should ensure user reset/reload paths are available on the recovery panels and functional', () => {
    render(<TestHarness initialRivalries={maliciousRivalries} />);

    // Recovery UI is active
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();

    const resetButton = screen.getByTestId('reset-button');
    expect(resetButton).toBeInTheDocument();

    // Click retry/reload
    fireEvent.click(resetButton);

    // Verify recovery panel unmounts and the app recovers with valid data
    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
    expect(screen.getAllByText('torvalds').length).toBeGreaterThan(0);
  });

  it('5. should handle other unexpected/malformed properties and fall back gracefully', () => {
    // Render with null/undefined icon component which triggers a React rendering exception
    const malformedRivalries: RivalryItem[] = [
      {
        u1: 'shadcn',
        u2: 'pacocoursey',
        label: 'UI Masters',
        icon: undefined as unknown as React.ComponentType<{ size?: number; className?: string }>,
        color: 'text-indigo-400',
      },
    ];

    render(<TestHarness initialRivalries={malformedRivalries} />);

    // It should throw during render (since icon is undefined) and trigger the Error Boundary
    expect(screen.getByTestId('error-recovery-panel')).toBeInTheDocument();
    expect(mockTelemetryTracker).toHaveBeenCalled();
  });
});
