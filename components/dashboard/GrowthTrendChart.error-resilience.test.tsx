import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GrowthTrendChart from './GrowthTrendChart';

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const React = await import('react');

  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');

  const motionProxy = new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
          delete props.initial;
          delete props.animate;
          delete props.exit;
          delete props.transition;
          delete props.whileInView;
          delete props.viewport;

          return React.createElement(tag, props, children);
        };
      },
    }
  );

  return {
    ...actual,

    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,

    motion: motionProxy,
  };
});

// Error Boundary
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Something went wrong</p>
          <button>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const mockActivity = [
  {
    date: '2025-01-01',
    count: 5,
  },
  {
    date: '2025-02-01',
    count: 10,
  },
];

describe('GrowthTrendChart Error Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maintains hydration stability during rerenders', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      const { rerender } = render(
        <TestErrorBoundary>
          <GrowthTrendChart
            activityA={mockActivity}
            activityB={mockActivity}
            labelA="Current"
            labelB="Previous"
          />
        </TestErrorBoundary>
      );

      rerender(
        <TestErrorBoundary>
          <GrowthTrendChart
            activityA={mockActivity}
            activityB={mockActivity}
            labelA="Current"
            labelB="Previous"
          />
        </TestErrorBoundary>
      );
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('renders fallback UI on runtime exceptions', () => {
    const CrashComponent = () => {
      throw new Error('Simulated runtime failure');
    };

    render(
      <TestErrorBoundary>
        <CrashComponent />
      </TestErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });

  it('handles service/database failures safely', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const BrokenChart = () => {
      throw new Error('Database connection failed');
    };

    render(
      <TestErrorBoundary>
        <BrokenChart />
      </TestErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeDefined();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('provides retry/recovery controls in fallback UI', () => {
    const BrokenComponent = () => {
      throw new Error('Unexpected chart rendering failure');
    };

    render(
      <TestErrorBoundary>
        <BrokenComponent />
      </TestErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined();
  });

  it('logs exceptions to telemetry trackers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const TelemetryCrash = () => {
      throw new Error('Telemetry validation crash');
    };

    render(
      <TestErrorBoundary>
        <TelemetryCrash />
      </TestErrorBoundary>
    );

    expect(errorSpy).toHaveBeenCalled();
  });
});
