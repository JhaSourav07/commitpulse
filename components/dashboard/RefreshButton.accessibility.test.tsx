import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RefreshButton from './RefreshButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useTransition: vi.fn(),
  };
});

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  });

  (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    get: () => null,
    toString: () => '',
  });

  (useTransition as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
    false,
    (cb: () => void) => cb(),
  ]);
});

describe('RefreshButton Accessibility', () => {
  it('has correct aria-label for screen readers', () => {
    render(<RefreshButton username="testuser" />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Refresh dashboard contribution data'
    );
  });

  it('has correct title attribute for tooltip accessibility', () => {
    render(<RefreshButton username="testuser" />);

    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      'Refresh dashboard contribution data'
    );
  });

  it('is reachable via keyboard focus', () => {
    render(<RefreshButton username="testuser" />);

    const btn = screen.getByRole('button');
    btn.focus();

    expect(btn).toHaveFocus();
  });

  it('is accessible via role', () => {
    render(<RefreshButton username="testuser" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('supports disabled state when pending', () => {
    (useTransition as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce([
      true,
      (cb: () => void) => cb(),
    ]);

    render(<RefreshButton username="testuser" />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
