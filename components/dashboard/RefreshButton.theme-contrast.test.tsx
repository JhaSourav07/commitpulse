import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RefreshButton from './RefreshButton';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return { ...actual, useTransition: vi.fn() };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark
        ? query === '(prefers-color-scheme: dark)'
        : query === '(prefers-color-scheme: light)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

beforeEach(() => {
  vi.mocked(useTransition).mockReturnValue([false, (cb: () => void) => cb()]);
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useSearchParams).mockReturnValue({
    get: vi.fn().mockReturnValue(null),
    toString: vi.fn().mockReturnValue(''),
  } as unknown as ReturnType<typeof useSearchParams>);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('RefreshButton — Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('renders in both dark and light matchMedia environments without error', () => {
    mockMatchMedia(true);
    const { unmount } = render(<RefreshButton username="testuser" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    unmount();

    mockMatchMedia(false);
    render(<RefreshButton username="testuser" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('button carries dark-mode border and hover classes in the markup', () => {
    mockMatchMedia(true);
    render(<RefreshButton username="testuser" />);
    const btn = screen.getByRole('button');
    expect(btn.classList.contains('dark:border-[rgba(255,255,255,0.15)]')).toBe(true);
    expect(btn.classList.contains('dark:hover:bg-white/10')).toBe(true);
  });

  it('button carries light-mode border and hover classes in the markup', () => {
    mockMatchMedia(false);
    render(<RefreshButton username="testuser" />);
    const btn = screen.getByRole('button');
    expect(btn.classList.contains('border-black/10')).toBe(true);
    expect(btn.classList.contains('hover:bg-gray-800')).toBe(true);
  });

  it('foreground text class (text-white) and background class (bg-black) are both present, ensuring text is not obscured', () => {
    mockMatchMedia(true);
    const { unmount } = render(<RefreshButton username="testuser" />);
    const btn = screen.getByRole('button');
    expect(btn.classList.contains('text-white')).toBe(true);
    expect(btn.classList.contains('bg-black')).toBe(true);
    unmount();

    mockMatchMedia(false);
    render(<RefreshButton username="testuser" />);
    const btn2 = screen.getByRole('button');
    expect(btn2.classList.contains('text-white')).toBe(true);
    expect(btn2.classList.contains('bg-black')).toBe(true);
  });

  it('disabled state applies opacity class without removing text or background styling', () => {
    vi.mocked(useTransition).mockReturnValue([true, (cb: () => void) => cb()]);
    mockMatchMedia(true);
    render(<RefreshButton username="testuser" />);
    const btn = screen.getByRole('button');
    expect(btn.classList.contains('disabled:opacity-50')).toBe(true);
    expect(btn.classList.contains('text-white')).toBe(true);
    expect(btn.classList.contains('bg-black')).toBe(true);
    expect(btn).toBeDisabled();
  });
});
