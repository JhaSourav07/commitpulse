// app/global-error.empty-fallback.test.tsx

import { describe, expect, it, vi } from 'vitest';
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

import GlobalError from './global-error';

describe('Global Error Page - Empty & Missing Input Fallbacks', () => {
  it('renders successfully when error is null', () => {
    expect(() =>
      render(<GlobalError error={null as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('A critical error occurred at the root level.')).toBeInTheDocument();
    expect(screen.getByText('Unknown global error')).toBeInTheDocument();
  });

  it('renders successfully when error is undefined', () => {
    expect(() =>
      render(<GlobalError error={undefined as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Unknown global error')).toBeInTheDocument();
  });

  it('renders successfully when error is an empty object', () => {
    expect(() =>
      render(<GlobalError error={{} as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Unknown global error')).toBeInTheDocument();
  });

  it('renders successfully when error has no message property', () => {
    expect(() =>
      render(<GlobalError error={{ name: 'CustomError' } as unknown as Error} reset={vi.fn()} />)
    ).not.toThrow();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Unknown global error')).toBeInTheDocument();
  });

  it('renders successfully when error message is an empty string', () => {
    expect(() => render(<GlobalError error={new Error('')} reset={vi.fn()} />)).not.toThrow();

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Unknown global error')).toBeInTheDocument();
  });

  it('renders interactive elements and triggers reset correctly in fallback state', () => {
    const resetMock = vi.fn();
    render(<GlobalError error={{} as unknown as Error} reset={resetMock} />);

    const retryButton = screen.getByRole('button', { name: /Try again/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(resetMock).toHaveBeenCalledOnce();
  });
});
