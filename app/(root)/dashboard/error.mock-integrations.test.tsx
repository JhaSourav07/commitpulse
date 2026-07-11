import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardError from './error';
import type { ReactNode } from 'react';

// Mock next/link to simulate routing in isolation
vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

// Mock logger as the integrated telemetry service
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

import logger from '@/lib/logger';

describe('DashboardError - mock integrations', () => {
  const resetMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Simulate a standard asynchronous service layer failure (e.g., timeout)
  it('renders pending state overlays/fallback when service layer fails', () => {
    render(<DashboardError error={new Error('Service timeout')} reset={resetMock} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong');
    expect(screen.getByText('Service timeout')).toBeInTheDocument();
  });

  // 2. Simulate database integration failure (API Rate Limit)
  it('triggers specific rate limit fallback when database hits API limit', () => {
    render(<DashboardError error={new Error('API limit exceeded')} reset={resetMock} />);

    expect(screen.getByText('API Limit Reached')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  // 3. Simulate local cache layer queried but data not found
  it('triggers specific not found fallback when cache returns no user', () => {
    render(<DashboardError error={new Error('User not found in cache')} reset={resetMock} />);

    expect(screen.getByText('User Not Found')).toBeInTheDocument();
    expect(screen.getByText('🕵️‍♂️')).toBeInTheDocument();
  });

  // 4. Verify correct fallback procedure when retry is triggered
  it('calls reset mechanism for complete cache sync on retry', () => {
    render(<DashboardError error={new Error('Service timeout')} reset={resetMock} />);

    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  // 5. Assert successful logging sync on failure callbacks
  it('writes complete telemetry sync to the mocked logger service', () => {
    const errorObj = new Error('Database retrieval timeout');
    render(<DashboardError error={errorObj} reset={resetMock} />);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Dashboard error',
      expect.objectContaining({ error: errorObj })
    );
  });
});
