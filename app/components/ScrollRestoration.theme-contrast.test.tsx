import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();
const originalScrollY = window.scrollY;

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration theme contrast behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    document.documentElement.classList.remove('dark');

    mockUsePathname.mockReturnValue('/');

    window.scrollTo = vi.fn();
  });
  afterEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      configurable: true,
    });
  });

  it('renders safely in dark theme mode', () => {
    document.documentElement.classList.add('dark');

    const { container } = render(<ScrollRestoration />);

    expect(container.firstChild).toBeNull();
  });

  it('renders safely in light theme mode', () => {
    document.documentElement.classList.remove('dark');

    const { container } = render(<ScrollRestoration />);

    expect(container.firstChild).toBeNull();
  });

  it('restores saved scroll position in dark theme mode', () => {
    document.documentElement.classList.add('dark');

    sessionStorage.setItem('scroll-position-/', '400');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 400);
  });

  it('restores saved scroll position in light theme mode', () => {
    document.documentElement.classList.remove('dark');

    sessionStorage.setItem('scroll-position-/', '200');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 200);
  });

  it('stores scroll position consistently regardless of theme', () => {
    document.documentElement.classList.add('dark');

    Object.defineProperty(window, 'scrollY', {
      value: 500,
      configurable: true,
    });

    render(<ScrollRestoration />);

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/')).toBe('500');
  });
});
