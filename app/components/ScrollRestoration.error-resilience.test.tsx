import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration error resilience behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUsePathname.mockReturnValue('/');
    window.scrollTo = vi.fn();
  });

  it('renders without crashing when no stored value exists', () => {
    expect(() => render(<ScrollRestoration />)).not.toThrow();
  });

  it('handles invalid numeric scroll values safely', () => {
    sessionStorage.setItem('scroll-position-/', 'not-a-number');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('stores scroll position successfully after repeated scroll events', () => {
    render(<ScrollRestoration />);

    Object.defineProperty(window, 'scrollY', {
      value: 500,
      configurable: true,
    });

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/')).toBe('500');
  });

  it('keeps pathname-specific storage isolated during recovery scenarios', () => {
    mockUsePathname.mockReturnValue('/recovery');

    render(<ScrollRestoration />);

    Object.defineProperty(window, 'scrollY', {
      value: 777,
      configurable: true,
    });

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/recovery')).toBe('777');
  });

  it('removes scroll listeners cleanly on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ScrollRestoration />);

    unmount();

    expect(removeSpy).toHaveBeenCalled();
  });
});
