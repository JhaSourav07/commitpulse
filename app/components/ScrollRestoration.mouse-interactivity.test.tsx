import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration mouse interactivity behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    mockUsePathname.mockReturnValue('/interactive');

    window.scrollTo = vi.fn();
  });

  it('registers a scroll listener when mounted', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<ScrollRestoration />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('restores position before interactive scrolling begins', () => {
    sessionStorage.setItem('scroll-position-/interactive', '200');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 200);
  });

  it('updates stored position after simulated scroll interaction', () => {
    render(<ScrollRestoration />);

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 350,
    });

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/interactive')).toBe('350');
  });

  it('persists latest value across multiple scroll interactions', () => {
    render(<ScrollRestoration />);

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 100,
    });

    window.dispatchEvent(new Event('scroll'));

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 600,
    });

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/interactive')).toBe('600');
  });

  it('removes interactive listeners during cleanup', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ScrollRestoration />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
