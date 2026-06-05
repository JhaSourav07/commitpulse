import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration empty fallback behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUsePathname.mockReturnValue('/');
    window.scrollTo = vi.fn();
  });

  it('renders null without crashing when no saved scroll position exists', () => {
    const { container } = render(<ScrollRestoration />);

    expect(container.firstChild).toBeNull();
  });

  it('does not scroll when sessionStorage has no saved position', () => {
    render(<ScrollRestoration />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('restores saved scroll position when value exists', () => {
    sessionStorage.setItem('scroll-position-/', '250');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 250);
  });

  it('stores current scroll position on scroll event', () => {
    Object.defineProperty(window, 'scrollY', {
      value: 300,
      configurable: true,
    });

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/')).toBe('300');
  });

  it('uses pathname-specific storage keys for empty fallback safety', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/dashboard')).toBeDefined();
  });
});
