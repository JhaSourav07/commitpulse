import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration responsive breakpoint behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('restores scroll position for mobile-sized route keys', () => {
    mockUsePathname.mockReturnValue('/mobile');

    sessionStorage.setItem('scroll-position-/mobile', '120');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 120);
  });

  it('restores scroll position for tablet-sized route keys', () => {
    mockUsePathname.mockReturnValue('/tablet');

    sessionStorage.setItem('scroll-position-/tablet', '240');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 240);
  });

  it('stores scroll positions independently across viewport-specific routes', () => {
    mockUsePathname.mockReturnValue('/mobile');

    Object.defineProperty(window, 'scrollY', {
      value: 375,
      configurable: true,
    });

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/mobile')).toBe('375');
    expect(sessionStorage.getItem('scroll-position-/desktop')).toBeNull();
  });

  it('handles narrow viewport style route names without crashing', () => {
    mockUsePathname.mockReturnValue('/viewport-375');

    expect(() => render(<ScrollRestoration />)).not.toThrow();
  });

  it('preserves scroll state across responsive-style route transitions', () => {
    mockUsePathname.mockReturnValue('/responsive-layout');

    Object.defineProperty(window, 'scrollY', {
      value: 640,
      configurable: true,
    });

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/responsive-layout')).toBe('640');
  });
});
