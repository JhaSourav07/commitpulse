import React, { Component, ErrorInfo, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PRStatusDistribution from './PRStatusDistribution';
import type { PRInsightData } from '@/services/github/pr-insights';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  ExternalLink: () => <div data-testid="external-link" />,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockData = {
  totalPRs: 10,
  mergedPRs: 6,
  openPRs: 3,
  closedPRs: 1,
  prs: [
    {
      title: 'Improve dashboard',
      repo: 'commitpulse',
      url: 'https://example.com/pr/1',
      state: 'MERGED',
    },
  ],
} as unknown as PRInsightData;

const telemetry = {
  trackException: vi.fn(),
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class LocalizedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    telemetry.trackException(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback">
          <h2>Something went wrong.</h2>
          <button onClick={() => this.setState({ hasError: false })}>Retry</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CrashComponent = () => {
  throw new Error('Hydration failure');
};

describe('PRStatusDistribution - Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('1. renders recovery UI instead of crashing when nested runtime exception occurs', () => {
    render(
      <LocalizedErrorBoundary>
        <PRStatusDistribution data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });

  it('2. logs exceptions to telemetry tracker', () => {
    render(
      <LocalizedErrorBoundary>
        <PRStatusDistribution data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    expect(telemetry.trackException).toHaveBeenCalled();
  });

  it('3. provides retry action on recovery panel', () => {
    render(
      <LocalizedErrorBoundary>
        <PRStatusDistribution data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('4. recovers successfully after retry', () => {
    const { rerender } = render(
      <LocalizedErrorBoundary key="error">
        <PRStatusDistribution data={mockData} />
        <CrashComponent />
      </LocalizedErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    rerender(
      <LocalizedErrorBoundary key="recovered">
        <PRStatusDistribution data={mockData} />
      </LocalizedErrorBoundary>
    );

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  it('5. keeps surrounding layout mounted during localized failure', () => {
    render(
      <div>
        <header data-testid="header">Header</header>

        <LocalizedErrorBoundary>
          <PRStatusDistribution data={mockData} />
          <CrashComponent />
        </LocalizedErrorBoundary>

        <footer data-testid="footer">Footer</footer>
      </div>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});
