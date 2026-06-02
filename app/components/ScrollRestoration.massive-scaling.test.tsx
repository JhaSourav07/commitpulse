import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration massive scaling behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUsePathname.mockReturnValue('/');
    window.scrollTo = vi.fn();
  });

  it('renders repeatedly without crashing under high mount volume', () => {
    expect(() => {
      for (let index = 0; index < 100; index++) {
        render(<ScrollRestoration />);
      }
    }).not.toThrow();
  });

  it('handles many stored scroll positions without breaking restoration', () => {
    for (let index = 0; index < 500; index++) {
      sessionStorage.setItem(`scroll-position-/page-${index}`, String(index));
    }

    mockUsePathname.mockReturnValue('/page-499');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 499);
  });

  it('stores scroll position correctly after many scroll events', () => {
    render(<ScrollRestoration />);

    for (let index = 0; index < 100; index++) {
      Object.defineProperty(window, 'scrollY', {
        value: index,
        configurable: true,
      });

      window.dispatchEvent(new Event('scroll'));
    }

    expect(sessionStorage.getItem('scroll-position-/')).toBe('99');
  });

  it('keeps pathname-specific keys isolated at scale', () => {
    for (let index = 0; index < 50; index++) {
      mockUsePathname.mockReturnValue(`/dashboard-${index}`);

      const { unmount } = render(<ScrollRestoration />);

      Object.defineProperty(window, 'scrollY', {
        value: index * 10,
        configurable: true,
      });

      window.dispatchEvent(new Event('scroll'));
      unmount();
    }

    expect(sessionStorage.getItem('scroll-position-/dashboard-0')).toBe('0');
    expect(sessionStorage.getItem('scroll-position-/dashboard-49')).toBe('490');
  });
  it('removes scroll listener safely after many unmount cycles', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    for (let index = 0; index < 25; index++) {
      const { unmount } = render(<ScrollRestoration />);
      unmount();
    }

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(25);
  });
});
