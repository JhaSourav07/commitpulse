import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import Navbar from './navbar';
import type { ReactNode } from 'react';

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

const originalLocalStorage = window.localStorage;

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});

type MatchMediaChangeListener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<MatchMediaChangeListener>();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addListener: vi.fn((listener: MatchMediaChangeListener) => listeners.add(listener)),
      removeListener: vi.fn((listener: MatchMediaChangeListener) => listeners.delete(listener)),
      addEventListener: vi.fn((event: string, listener: MatchMediaChangeListener) => {
        if (event === 'change') listeners.add(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: MatchMediaChangeListener) => {
        if (event === 'change') listeners.delete(listener);
      }),
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) => {
        listener({
          matches,
          media: '(min-width: 768px)',
        } as MediaQueryListEvent);
      });
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
  Globe: () => <div>GlobeIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Moon: () => <div>MoonIcon</div>,

  Search: () => <div>SearchIcon</div>,
  ArrowRight: () => <div>ArrowRightIcon</div>,

  ChevronDown: () => <div>ChevronDownIcon</div>,
  Check: () => <div>CheckIcon</div>,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
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
    window.localStorage?.clear();
    document.documentElement.className = '';
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

  it('keeps menu open when a plain resize event fires below desktop', () => {
    render(<Navbar />);

    const button = screen.getByLabelText(/open menu/i);

    fireEvent.click(button);

    window.dispatchEvent(new Event('resize'));

    expect(button.getAttribute('aria-expanded')).toBe('true');
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
    expect(screen.getAllByRole('link', { name: /github repo/i })).toHaveLength(2);
  });

  it('closes the open hamburger menu when crossing into the desktop breakpoint', () => {
    const matchMedia = mockMatchMedia(false);

    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-expanded')).toBe(
      'true'
    );

    act(() => {
      matchMedia.setMatches(true);
    });

    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );
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

  it('dismisses the open mobile menu when a dropdown link is tapped', () => {
    window.innerWidth = 375;
    mockMatchMedia(false);

    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByText('Language / Bhasha')).toBeTruthy();
    expect(screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-expanded')).toBe(
      'true'
    );

    const compareLinks = screen.getAllByRole('link', { name: /compare/i });
    fireEvent.click(compareLinks[compareLinks.length - 1]);

    expect(screen.queryByText('Language / Bhasha')).toBeNull();
    expect(screen.getByRole('button', { name: /open menu/i }).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });
});
