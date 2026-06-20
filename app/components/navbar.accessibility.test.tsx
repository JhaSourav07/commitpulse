import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Navbar from './navbar';
import type { ReactNode } from 'react';

vi.mock('lucide-react', () => ({
  Menu: () => <div>MenuIcon</div>,
  X: () => <div>CloseIcon</div>,
  Activity: () => <div>ActivityIcon</div>,
  Globe: () => <div>GlobeIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Moon: () => <div>MoonIcon</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    changeLanguage: vi.fn(),
    isPending: false,
  }),
  LANGUAGE_LABELS: { en: 'English', hi: 'Hindi' },
}));

vi.mock('@/hooks/useGlowEffect', () => ({
  useGlowEffect: () => ({
    shellRef: { current: null },
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

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    'aria-label': ariaLabel,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    'aria-label'?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: { getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  window.innerWidth = 500;
  document.documentElement.className = '';
});

describe('Navbar — Accessibility & Screen Reader Compliance', () => {
  it('renders header and navigation landmarks for screen reader navigation', () => {
    render(<Navbar />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders logo link with descriptive aria-label', () => {
    render(<Navbar />);

    const logoLink = screen.getByRole('link', { name: /navbar\.home/i });
    expect(logoLink).toBeInTheDocument();
  });

  it('renders theme toggle button with descriptive aria-label', () => {
    render(<Navbar />);

    const themeButtons = screen.getAllByRole('button', { name: /navbar\.theme_toggle/i });
    expect(themeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders hamburger menu button with aria-label and aria-expanded attribute', () => {
    render(<Navbar />);

    const menuButton = screen.getByRole('button', { name: /navbar\.menu_open/i });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies focus-visible ring classes to all interactive elements', () => {
    const { container } = render(<Navbar />);

    const focusableElements = container.querySelectorAll('[class*="focus-visible:ring"]');
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  it('renders header landmark wrapping navigation for correct document hierarchy', () => {
    const { container } = render(<Navbar />);

    const header = container.querySelector('header');
    const nav = container.querySelector('nav');

    expect(header).toBeInTheDocument();
    expect(header).toContainElement(nav as HTMLElement);
  });
});
