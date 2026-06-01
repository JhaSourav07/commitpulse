import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReturnToTop from './ReturnToTop';
import type React from 'react';
import { screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('lucide-react', () => ({
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

describe('ReturnToTop', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 1000,
      writable: true,
    });

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  // Test 1: Component does not render when not at bottom of page (initial state)
  it('does not render when not at bottom of page', () => {
    render(<ReturnToTop />);

    expect(screen.queryByRole('button', { name: /return to top/i })).toBeNull();
  });

  // Test 2: 'Return to top' aria-label is on the button when visible
  it('renders button with aria-label when visible', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 750,
    });

    render(<ReturnToTop />);

    fireEvent.scroll(window);

    expect(screen.getByRole('button', { name: /return to top/i })).toBeTruthy();
  });

  // Test 3: Clicking the button calls window.scrollTo
  it('calls window.scrollTo when clicked', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 750,
    });

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<ReturnToTop />);

    fireEvent.scroll(window);

    fireEvent.click(screen.getByRole('button', { name: /return to top/i }));

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });

  // Test 4: ChevronUp icon is rendered inside the button
  it('renders ChevronUp icon inside the button', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 750,
    });

    render(<ReturnToTop />);

    fireEvent.scroll(window);

    expect(screen.getByTestId('chevron-up-icon')).toBeTruthy();
  });

  it('adds scroll event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<ReturnToTop />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    });
  });

  it('removes scroll event listener on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ReturnToTop />);

    const scrollHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'scroll')?.[1];

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', scrollHandler);
  });
});
