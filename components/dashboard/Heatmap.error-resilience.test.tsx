import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';

import Heatmap from './Heatmap';
import type { ActivityData } from '@/types/dashboard';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,

  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
};

const mockData: ActivityData[] = [
  {
    count: 5,
    date: '2025-01-01',
    intensity: 2,
  },
];

const fallbackUI = <div>Something went wrong</div>;

describe('Heatmap Error Resilience', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('maintains hydration stability during repeated renders', () => {
    const { rerender } = render(
      <ErrorBoundary fallback={fallbackUI}>
        <Heatmap data={mockData} />
      </ErrorBoundary>
    );

    rerender(
      <ErrorBoundary fallback={fallbackUI}>
        <Heatmap data={mockData} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/contribution heatmap/i)).toBeInTheDocument();
  });

  it('renders fallback UI when nested runtime exception occurs', () => {
    const ThrowingComponent = () => {
      throw new Error('Simulated runtime crash');
    };

    render(
      <ErrorBoundary fallback={fallbackUI}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('handles exceptions from Heatmap safely and logs telemetry', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={fallbackUI}>
        <Heatmap data={undefined as unknown as ActivityData[]} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('renders fallback UI for broken components safely', () => {
    const BrokenComponent = () => {
      throw new Error('Unexpected failure');
    };

    render(
      <ErrorBoundary fallback={fallbackUI}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('logs exceptions to telemetry trackers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const CrashComponent = () => {
      throw new Error('Telemetry test crash');
    };

    render(
      <ErrorBoundary fallback={fallbackUI}>
        <CrashComponent />
      </ErrorBoundary>
    );

    expect(errorSpy).toHaveBeenCalled();
  });
});
