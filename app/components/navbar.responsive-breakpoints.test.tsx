import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Navbar from './navbar';

// Mock matchMedia globally for JSDOM
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated but required for compatibility
      removeListener: vi.fn(), // Deprecated but required for compatibility
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock('@/hooks/useGlowEffect', () => ({
  useGlowEffect: () => ({
    shellRef: null,
    shellVars: {},
    handleMouseEnter: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseLeave: vi.fn(),
  }),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('./theme-switch', () => ({
  useThemeToggle: () => ({
    isDark: false,
    mounted: true,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'navbar.menu_open': 'Open menu',
        'navbar.menu_close': 'Close menu',
        'navbar.home': 'Home',
        'navbar.repo': 'GitHub Repo',
        'navbar.theme_toggle': 'Toggle theme',
        'navbar.generator': 'Generator',
        'navbar.compare': 'Compare',
        'navbar.burnout_radar': 'Burnout Radar',
        'navbar.customization_studio': 'Customization Studio',
      };
      return translations[key] || key;
    },
    language: 'en',
    changeLanguage: vi.fn(),
    isPending: false,
  }),
  LANGUAGE_LABELS: {
    en: 'English',
    hi: 'Hindi',
  },
}));

describe('Navbar Responsive Breakpoints & Menu Toggle', () => {
  it('1. Renders the Navbar component without the mobile menu initially open', () => {
    render(<Navbar />);

    // Hamburger button should have "Open menu" aria-label
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toBeDefined();

    // The mobile dropdown theme toggle should NOT be in the document initially
    const mobileThemeToggle = screen.queryByText('Switch to Dark Mode');
    expect(mobileThemeToggle).toBeNull();
  });

  it('2. Toggles the mobile menu open and closed when hamburger button is clicked', () => {
    render(<Navbar />);

    // Open menu
    const button = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(button);

    // The button should now say "Close menu"
    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    expect(closeButton).toBeDefined();

    // The mobile dropdown should now be rendered and visible
    const mobileThemeToggle = screen.getByText('Switch to Dark Mode');
    expect(mobileThemeToggle).toBeDefined();

    // Close menu by clicking the X
    fireEvent.click(closeButton);
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
    expect(screen.queryByText('Switch to Dark Mode')).toBeNull();
  });

  it('3. Closes the mobile menu automatically when the window is resized to desktop (min-width: 768px)', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

    // Override the mock specifically to capture the resize event listener
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            changeHandler = handler;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<Navbar />);

    // Open the menu first on mobile
    const button = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(button);
    expect(screen.queryByText('Switch to Dark Mode')).toBeDefined();

    // Simulate resizing to desktop width (triggering matchMedia change event)
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as unknown as MediaQueryListEvent);
      }
    });

    // The menu should automatically close
    expect(screen.queryByText('Switch to Dark Mode')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
  });
});
