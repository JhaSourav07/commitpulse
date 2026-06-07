import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration timezone boundary behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('restores scroll position consistently for UTC-style route keys', () => {
    mockUsePathname.mockReturnValue('/utc');

    sessionStorage.setItem('scroll-position-/utc', '100');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 100);
  });

  it('restores scroll position consistently for IST-style route keys', () => {
    mockUsePathname.mockReturnValue('/ist');

    sessionStorage.setItem('scroll-position-/ist', '250');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 250);
  });

  it('keeps timezone-specific pathname storage isolated', () => {
    mockUsePathname.mockReturnValue('/jst');

    Object.defineProperty(window, 'scrollY', {
      value: 400,
      configurable: true,
    });

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/jst')).toBe('400');
    expect(sessionStorage.getItem('scroll-position-/utc')).toBeNull();
  });

  it('handles leap-year style date routes without affecting restoration', () => {
    mockUsePathname.mockReturnValue('/2024-02-29');

    sessionStorage.setItem('scroll-position-/2024-02-29', '500');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
  });

  it('preserves route-specific scroll state across boundary-like transitions', () => {
    mockUsePathname.mockReturnValue('/dst-transition');

    Object.defineProperty(window, 'scrollY', {
      value: 777,
      configurable: true,
    });

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/dst-transition')).toBe('777');
  });
});
