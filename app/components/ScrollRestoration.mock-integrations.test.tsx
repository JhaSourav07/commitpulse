import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration mock integrations behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUsePathname.mockReturnValue('/');
    window.scrollTo = vi.fn();
  });

  it('queries cached scroll position before restoration logic executes', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    render(<ScrollRestoration />);

    expect(getItemSpy).toHaveBeenCalledWith('scroll-position-/');
  });

  it('restores scroll position from cached storage values', () => {
    sessionStorage.setItem('scroll-position-/', '150');

    render(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 150);
  });

  it('falls back safely when cached values are unavailable', () => {
    render(<ScrollRestoration />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('writes updated scroll position into cache after scroll events', () => {
    render(<ScrollRestoration />);

    Object.defineProperty(window, 'scrollY', {
      value: 420,
      configurable: true,
    });

    window.dispatchEvent(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/')).toBe('420');
  });

  it('cleans up integration listeners after unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ScrollRestoration />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
