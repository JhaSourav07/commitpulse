import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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

  it('3. Closes the mobile menu automatically when the window is resized to desktop (min-width: 1024px)', () => {
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

  it('4. Hides the desktop nav row on mobile and only reveals mobile hamburger controls, via complementary lg: classes', () => {
    const { container } = render(<Navbar />);

    const desktopNavRow =
      container.querySelector('.hidden.items-center.gap-2.md\\:flex') ||
      container.querySelector('.hidden.items-center.gap-2.lg\\:flex');
    expect(desktopNavRow).toBeInTheDocument();

    const mobileControls =
      container.querySelector('.md\\:hidden.inline-flex.items-center.justify-center.gap-1') ||
      container.querySelector('.lg\\:hidden.inline-flex.items-center.justify-center.gap-1');
    expect(mobileControls).toBeInTheDocument();
  });

  it('5. Does not use fixed pixel widths on nav elements that could cause horizontal overflow on narrow viewports', () => {
    const { container } = render(<Navbar />);

    const allEls = container.querySelectorAll('[class]');
    allEls.forEach((el) => {
      const classes = el.getAttribute('class') || '';
      expect(classes).not.toMatch(/\bw-\[\d+px\]/);
    });
  });

  it('6. Hides the "GitHub Repo" text label below the lg breakpoint while keeping the icon visible', () => {
    const { container } = render(<Navbar />);

    const repoLabel = container.querySelector('.hidden.lg\\:inline');
    expect(repoLabel).toBeInTheDocument();
    expect(repoLabel).toHaveTextContent('GitHub Repo');
  });

  it('7. Applies smaller responsive text classes to long nav labels than short ones, to prevent clipping', () => {
    render(<Navbar />);

    const longLabelLink = screen.getByRole('link', { name: /Customization Studio/i });
    const shortLabelLink = screen.getByRole('link', { name: /^Compare$/i });

    expect(longLabelLink).toHaveClass('text-[11px]');
    expect(shortLabelLink).toHaveClass('text-xs');
    expect(shortLabelLink).not.toHaveClass('text-[11px]');
  });

  it('8. Closes the mobile menu via link navigation, independently of the hamburger toggle button', () => {
    const { container } = render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeDefined();

    const mobileMenu = container.querySelector('ul.space-y-1') as HTMLElement;
    const compareLink = within(mobileMenu).getByRole('link', { name: /^Compare$/i });
    fireEvent.click(compareLink);

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
    expect(screen.queryByText('Switch to Dark Mode')).toBeNull();
  });
});
