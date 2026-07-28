import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { Component, type ReactNode } from 'react';
import EducationalCurveTracker from './EducationalCurveTracker';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Error Boundary for resilience wrapping tests
// ---------------------------------------------------------------------------
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError)
      return (
        <div data-testid="error-recovery-panel">
          <p>Something went wrong</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Reload Panel
          </button>
        </div>
      );
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EducationalCurveTracker - Error Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders null when the API returns success: false', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, error: 'User not found' }),
    });

    const { container } = render(<EducationalCurveTracker username="unknown_user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders null when the API returns success: false with no error message', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false }),
    });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders null when a network error is thrown', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders null when fetch throws a non-Error exception', async () => {
    mockFetch.mockRejectedValue('some string error');

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('does not crash when timeline is an empty array', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          totalStudyDays: 0,
          primaryDomain: 'None',
          timeline: [],
        },
      }),
    });

    expect(() => render(<EducationalCurveTracker username="user" />)).not.toThrow();

    await waitFor(() => {
      expect(screen.getByText('None')).toBeInTheDocument();
    });
  });

  it('renders null when data is null despite success: true', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, data: null }),
    });

    const { container } = render(<EducationalCurveTracker username="user" />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('survives being wrapped in an error boundary without triggering it on valid data', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          totalStudyDays: 3,
          primaryDomain: 'Web Dev',
          timeline: [{ date: '2026-05-01', totalDailyCommits: 2, domains: {} }],
        },
      }),
    });

    render(
      <ErrorBoundary>
        <EducationalCurveTracker username="user" />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Web Dev')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('error-recovery-panel')).not.toBeInTheDocument();
  });
});
