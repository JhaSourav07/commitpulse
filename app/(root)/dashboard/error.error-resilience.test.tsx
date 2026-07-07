import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardError from './error';
import type { ReactNode } from 'react';

// --------------------
// Mock next/link
// --------------------
vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

// --------------------
// Mock logger
// --------------------
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

import logger from '@/lib/logger';

describe('DashboardError - error resilience', () => {
  const resetMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. default error UI renders
  it('renders generic error state', () => {
    render(<DashboardError error={new Error('Something went wrong')} reset={resetMock} />);

    // target the heading explicitly (most reliable)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong');

    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByText('Go back home')).toBeInTheDocument();
  });

  // 2. rate limit state
  it('renders rate limit UI when API limit error occurs', () => {
    render(<DashboardError error={new Error('API limit exceeded')} reset={resetMock} />);

    expect(screen.getByText('API Limit Reached')).toBeInTheDocument();
    expect(screen.getByText(/GitHub's API rate limit/i)).toBeInTheDocument();
  });

  // 3. not found state
  it('renders not found UI when user is missing', () => {
    render(<DashboardError error={new Error('User not found')} reset={resetMock} />);

    expect(screen.getByText('User Not Found')).toBeInTheDocument();
    expect(screen.getByText(/couldn't find a GitHub user/i)).toBeInTheDocument();
  });

  // 4. reset button triggers reset callback
  it('calls reset when Try again is clicked', () => {
    render(<DashboardError error={new Error('Something went wrong')} reset={resetMock} />);

    fireEvent.click(screen.getByText('Try again'));

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  // 5. logger is called on mount
  it('logs error to logger on render', () => {
    const err = new Error('Crash test');

    render(<DashboardError error={err} reset={resetMock} />);

    expect(logger.error).toHaveBeenCalledWith(
      'Dashboard error',
      expect.objectContaining({
        error: err,
      })
    );
  });
});
