import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareSheet from './ShareSheet';
import type { DashboardExportData } from '@/types/dashboard';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
}));

const mockUseShareActions = vi.fn();

vi.mock('@/hooks/useShareActions', () => ({
  useShareActions: (...args: unknown[]) => mockUseShareActions(...args),
}));

const healthyShareActions = {
  states: {},
  handleTwitter: vi.fn(),
  handleLinkedIn: vi.fn(),
  handleReddit: vi.fn(),
  handleDownloadPNG: vi.fn(),
  handleDownloadWEBP: vi.fn(),
  handleDownloadSVG: vi.fn(),
  handleCopyMarkdown: vi.fn(),
  handleDownloadJSON: vi.fn(),
  handleNativeShare: vi.fn(),
};

type EBProps = { children: React.ReactNode };
type EBState = { hasError: boolean; message: string };

class ErrorBoundary extends React.Component<EBProps, EBState> {
  state: EBState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): EBState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught exception:', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div data-testid="error-fallback">
          <p>Something went wrong.</p>
          <p data-testid="error-message">{this.state.message}</p>
          <button onClick={() => this.setState({ hasError: false, message: '' })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const mockExportData: DashboardExportData = {
  stats: { currentStreak: 5, peakStreak: 10, totalContributions: 100 },
  languages: [],
  activity: [],
};

const onClose = vi.fn();

const defaultProps = {
  username: 'octocat',
  isOpen: true,
  onClose,
  exportData: mockExportData,
};

describe('ShareSheet — Hydration Stability, Exception Safety & Error Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseShareActions.mockReturnValue(healthyShareActions);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders nothing when isOpen is false, preventing hydration mismatch', () => {
    const { container } = render(<ShareSheet {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('mounts cleanly when isOpen is true with all key elements present', () => {
    render(<ShareSheet {...defaultProps} />);
    expect(screen.getByRole('button', { name: /close share panel/i })).toBeTruthy();
    expect(screen.getByTestId('qr-code')).toBeTruthy();
    expect(screen.getByRole('button', { name: /share on x/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /github wrapped/i })).toBeTruthy();
  });

  it('ErrorBoundary catches a render-phase exception from useShareActions and shows recovery UI', () => {
    const boom = new Error('ShareActions service unavailable');
    mockUseShareActions.mockImplementation(() => {
      throw boom;
    });

    render(
      <ErrorBoundary>
        <ShareSheet {...defaultProps} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-fallback')).toBeTruthy();
    expect(screen.getByTestId('error-message').textContent).toBe(
      'ShareActions service unavailable'
    );
    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary] Caught exception:',
      boom,
      expect.any(String)
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('component remains mounted after window.open is called on the GitHub Wrapped button', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<ShareSheet {...defaultProps} />);

    const wrappedButton = screen.getByRole('button', { name: /github wrapped/i });
    wrappedButton.click();

    expect(openSpy).toHaveBeenCalledWith('/dashboard/octocat/wrapped', '_blank');
    expect(screen.getByRole('button', { name: /close share panel/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /share on x/i })).toBeTruthy();

    openSpy.mockRestore();
  });

  it('renders without crashing when exportData contains zero and empty values', () => {
    const minimalExportData: DashboardExportData = {
      stats: { currentStreak: 0, peakStreak: 0, totalContributions: 0 },
      languages: [],
      activity: [],
    };

    expect(() =>
      render(
        <ErrorBoundary>
          <ShareSheet {...defaultProps} exportData={minimalExportData} />
        </ErrorBoundary>
      )
    ).not.toThrow();

    expect(screen.queryByTestId('error-fallback')).toBeNull();
    expect(screen.getByRole('button', { name: /close share panel/i })).toBeTruthy();
  });
});
