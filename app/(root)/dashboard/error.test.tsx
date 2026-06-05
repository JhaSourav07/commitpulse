import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorPage from './error';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Dashboard Error Page', () => {
  it('renders API limit UI', () => {
    render(<ErrorPage error={new Error('API limit reached')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'API Limit Reached' })).toBeInTheDocument();
  });

  it('renders not found UI', () => {
    render(<ErrorPage error={new Error('not found')} reset={vi.fn()} />);

    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it('renders generic error UI', () => {
    render(<ErrorPage error={new Error('something went wrong')} reset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows Try again button', () => {
    render(<ErrorPage error={new Error('error')} reset={vi.fn()} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls reset when Try again is clicked', () => {
    const reset = vi.fn();

    render(<ErrorPage error={new Error('error')} reset={reset} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('shows Go back home link', () => {
    render(<ErrorPage error={new Error('error')} reset={vi.fn()} />);

    expect(screen.getByRole('link', { name: /go back home/i })).toBeInTheDocument();
  });
});
