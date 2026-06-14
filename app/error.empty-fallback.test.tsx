// app/error.empty-fallback.test.tsx

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import ErrorBoundary from './error';

describe('Root Error Boundary - Empty & Missing Input Fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders successfully when error is null', () => {
    expect(() =>
      render(<ErrorBoundary error={null as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(
      screen.getByRole('heading', {
        name: /Looks like an exception was thrown in the application/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown runtime error occurred.')).toBeInTheDocument();
  });

  it('renders successfully when error is undefined', () => {
    expect(() =>
      render(<ErrorBoundary error={undefined as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(
      screen.getByRole('heading', {
        name: /Looks like an exception was thrown in the application/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown runtime error occurred.')).toBeInTheDocument();
  });

  it('renders successfully when error is an empty object', () => {
    expect(() =>
      render(<ErrorBoundary error={{} as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(
      screen.getByRole('heading', {
        name: /Looks like an exception was thrown in the application/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown runtime error occurred.')).toBeInTheDocument();
  });

  it('renders successfully when error has no message property', () => {
    expect(() =>
      render(<ErrorBoundary error={{ name: 'CustomError' } as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(
      screen.getByRole('heading', {
        name: /Looks like an exception was thrown in the application/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown runtime error occurred.')).toBeInTheDocument();
  });

  it('renders successfully when error message is an empty string', () => {
    expect(() => render(<ErrorBoundary error={new Error('')} reset={vi.fn()} />)).not.toThrow();

    expect(
      screen.getByRole('heading', {
        name: /Looks like an exception was thrown in the application/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Unknown runtime error occurred.')).toBeInTheDocument();
  });

  it('renders interactive elements and triggers actions correctly in fallback state', async () => {
    const resetMock = vi.fn();
    render(<ErrorBoundary error={{} as unknown as Error} reset={resetMock} />);

    // Check actions
    const retryButton = screen.getByRole('button', { name: /git fetch/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledOnce();

    const homeLink = screen.getByRole('link', { name: /Return to main/i });
    expect(homeLink).toBeInTheDocument();

    // Check clipboard copy fallback behavior
    const terminalContainer = screen.getByText('commitpulse — error').closest('div');
    expect(terminalContainer).toBeInTheDocument();
    if (terminalContainer) {
      fireEvent.click(terminalContainer);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Unknown exception in the render tree.')
      );
    }
  });
});
