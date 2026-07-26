import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrollRestoration from './ScrollRestoration';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration', () => {
  const scrollToMock = vi.fn();
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

  beforeEach(() => {
    vi.clearAllMocks();

    mockUsePathname.mockReturnValue('/dashboard');

    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: scrollToMock,
    });

    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('mounts cleanly without crashing', () => {
    const { container } = render(<ScrollRestoration />);

    expect(container).toBeDefined();
  });

  it('restores saved scroll position on mount', () => {
    sessionStorage.setItem('scroll-position-/dashboard', '250');

    render(<ScrollRestoration />);

    expect(scrollToMock).toHaveBeenCalledWith(0, 250);
  });

  it('registers scroll listener and saves scroll position', () => {
    render(<ScrollRestoration />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const handler = addEventListenerSpy.mock.calls.find(
      ([event]) => event === 'scroll'
    )?.[1] as EventListener;

    handler(new Event('scroll'));

    expect(sessionStorage.getItem('scroll-position-/dashboard')).toBe('500');
  });

  it('does not scroll when no saved position exists', () => {
    render(<ScrollRestoration />);

    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it('removes scroll listener on unmount', () => {
    const { unmount } = render(<ScrollRestoration />);

    const handler = addEventListenerSpy.mock.calls.find(([event]) => event === 'scroll')?.[1];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', handler);
  });
});
