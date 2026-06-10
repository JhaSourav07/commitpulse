import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorPage from './error';

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

describe('Dashboard Error Page', () => {
  it('renders the API limit emoji for API limit reached errors', () => {
    render(<ErrorPage error={new Error('API limit reached')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'API Limit Reached' })).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('renders the not found emoji for User not found errors', () => {
    render(<ErrorPage error={new Error('User not found')} reset={vi.fn()} />);

    expect(screen.getByText(/not found/i)).toBeInTheDocument();
    expect(screen.getByText('🕵️‍♂️')).toBeInTheDocument();
  });

  it('renders the generic error emoji for other errors', () => {
    render(<ErrorPage error={new Error('Something went wrong')} reset={vi.fn()} />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
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
