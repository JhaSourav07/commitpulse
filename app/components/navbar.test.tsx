import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from './navbar';
import type { ReactNode } from 'react';

function createMatchMedia(matches = false) {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];
  const mediaQuery = {
    matches,
    media: '(min-width: 768px)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const index = listeners.indexOf(listener);
        if (index !== -1) listeners.splice(index, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    triggerChange(newMatches: boolean) {
      mediaQuery.matches = newMatches;
      const event = { matches: newMatches, media: mediaQuery.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  } as unknown as MediaQueryList & { triggerChange: (matches: boolean) => void };

  return mediaQuery;
}

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Menu: () => <div>MenuIcon</div>,
  X: () => <div>CloseIcon</div>,
  Activity: () => <div>ActivityIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Moon: () => <div>MoonIcon</div>,
}));

describe('Navbar mobile menu', () => {
  beforeEach(() => {
    window.innerWidth = 500;
    window.matchMedia = vi.fn().mockImplementation(() => createMatchMedia(false));
  });

  it('menu is hidden by default', () => {
    render(<Navbar />);

    expect(screen.queryByText(/closeicon/i)).toBeNull();
  });

  it('opens menu on button click', () => {
    render(<Navbar />);

    const button = screen.getByLabelText(/open menu/i);

    fireEvent.click(button);

    expect(screen.getByText(/closeicon/i)).toBeTruthy();
  });

  it('closes menu on second click', () => {
    render(<Navbar />);

    const button = screen.getByLabelText(/open menu/i);

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByText(/closeicon/i)).toBeNull();
  });

  it('closes menu on resize to desktop', async () => {
    const mediaQuery = createMatchMedia(false);
    window.matchMedia = vi.fn().mockImplementation(() => mediaQuery);

    render(<Navbar />);

    const toggleButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(toggleButton);

    const closeButton = screen.getByLabelText(/close menu/i);
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      mediaQuery.triggerChange(true);
    });

    await waitFor(() => {
      const reopenedButton = screen.getByLabelText(/open menu/i);
      expect(reopenedButton.getAttribute('aria-expanded')).toBe('false');
    });

    expect(screen.queryByText(/closeicon/i)).toBeNull();
  });

  describe('responsive breakpoints', () => {
    it('closes the hamburger menu when viewport becomes desktop width', async () => {
      const mediaQuery = createMatchMedia(false);
      window.matchMedia = vi.fn().mockImplementation(() => mediaQuery);

      render(<Navbar />);

      const openMenuButton = screen.getByLabelText(/open menu/i);
      fireEvent.click(openMenuButton);

      const closeMenuButton = screen.getByLabelText(/close menu/i);
      expect(closeMenuButton.getAttribute('aria-expanded')).toBe('true');

      act(() => {
        mediaQuery.triggerChange(true);
      });

      await waitFor(() => {
        const reopenedButton = screen.getByLabelText(/open menu/i);
        expect(reopenedButton.getAttribute('aria-expanded')).toBe('false');
      });

      expect(screen.queryByText(/closeicon/i)).toBeNull();
    });

    it('keeps the hamburger menu closed when initially mounted on desktop viewport', async () => {
      const mediaQuery = createMatchMedia(true);
      window.matchMedia = vi.fn().mockImplementation(() => mediaQuery);

      render(<Navbar />);

      await waitFor(() => {
        const openMenuButton = screen.getByLabelText(/open menu/i);
        expect(openMenuButton.getAttribute('aria-expanded')).toBe('false');
      });

      expect(screen.queryByText(/closeicon/i)).toBeNull();
    });
  });
});
