import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from './navbar';
import type { ReactNode } from 'react';

function mockMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];

  const mediaQueryList = {
    get matches() {
      return matches;
    },
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
  } as unknown as MediaQueryList;

  window.matchMedia = vi.fn().mockImplementation(() => mediaQueryList);

  return {
    setMatches(newMatches: boolean) {
      matches = newMatches;
      const event = { matches: newMatches, media: '(min-width: 768px)' } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
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
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    window.innerWidth = 500;
    mockMatchMedia(false);
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
    const mediaQuery = mockMatchMedia(false);

    render(<Navbar />);

    const toggleButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(toggleButton);

    const closeButton = screen.getByLabelText(/close menu/i);
    expect(closeButton.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      mediaQuery.setMatches(true);
    });

    await waitFor(() => {
      const reopenedButton = screen.getByLabelText(/open menu/i);
      expect(reopenedButton.getAttribute('aria-expanded')).toBe('false');
    });

    expect(screen.queryByText(/closeicon/i)).toBeNull();
  });

  describe('responsive breakpoints', () => {
    it('closes the hamburger menu when viewport becomes desktop width', async () => {
      const mediaQuery = mockMatchMedia(false);

      render(<Navbar />);

      const openMenuButton = screen.getByLabelText(/open menu/i);
      fireEvent.click(openMenuButton);

      const closeMenuButton = screen.getByLabelText(/close menu/i);
      expect(closeMenuButton.getAttribute('aria-expanded')).toBe('true');

      act(() => {
        mediaQuery.setMatches(true);
      });

      await waitFor(() => {
        const reopenedButton = screen.getByLabelText(/open menu/i);
        expect(reopenedButton.getAttribute('aria-expanded')).toBe('false');
      });

      expect(screen.queryByText(/closeicon/i)).toBeNull();
    });

    it('keeps the hamburger menu closed when initially mounted on desktop viewport', async () => {
      const mediaQuery = mockMatchMedia(true);

      render(<Navbar />);

      await waitFor(() => {
        const openMenuButton = screen.getByLabelText(/open menu/i);
        expect(openMenuButton.getAttribute('aria-expanded')).toBe('false');
      });

      expect(screen.queryByText(/closeicon/i)).toBeNull();
    });
  });
});

describe('Navbar responsive breakpoints', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    window.innerWidth = 500;
    window.localStorage?.clear();
    document.documentElement.className = '';
  });

  it('renders semantic navigation and mobile menu controls at small widths', () => {
    mockMatchMedia(false);

    render(<Navbar />);

    expect(screen.getByRole('navigation')).toBeTruthy();
    expect(screen.getByRole('link', { name: /go to home/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect(screen.getAllByRole('link', { name: /customization studio/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /github repo/i })).toHaveLength(2);
  });

  it('closes the open hamburger menu when crossing into the desktop breakpoint', () => {
    const mediaQuery = mockMatchMedia(false);

    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-expanded')).toBe(
      'true'
    );

    act(() => {
      mediaQuery.setMatches(true);
    });

    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );
    expect(screen.getAllByRole('link', { name: /customization studio/i })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: /github repo/i })).toHaveLength(1);
  });

  it('should verify responsive rendering and elements of Navbar (Variation 1) by toggling hamburger menu state smoothly', () => {
    window.innerWidth = 375;
    mockMatchMedia(false);

    render(<Navbar />);

    const toggleButton = screen.getByRole('button', { name: /open menu/i });
    expect(toggleButton).toBeTruthy();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect(screen.getByText(/closeicon/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });
});
