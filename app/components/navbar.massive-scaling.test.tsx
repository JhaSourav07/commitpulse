import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import Navbar from './navbar';

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

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'navbar.home': 'Go to Home',
        'navbar.menu_open': 'Open Menu',
        'navbar.menu_close': 'Close Menu',
        'navbar.theme_toggle': 'Toggle Theme',
        'navbar.repo': 'GitHub Repo',
        'navbar.compare': 'Compare',
        'navbar.generator': 'Generator',
        'navbar.burnout_radar': 'Burnout Radar',
        'navbar.customization_studio': 'Customization Studio',
      };

      return map[key] ?? key;
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
    onClick,
    'aria-label': ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    'aria-label'?: string;
  }) => (
    <a href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

function mockMatchMedia(initialMatches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: initialMatches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('Navbar massive scaling', () => {
  beforeEach(() => {
    mockMatchMedia(false);

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    document.documentElement.className = '';
  });

  it('renders repeatedly without memory or DOM instability', () => {
    for (let i = 0; i < 200; i++) {
      const { unmount } = render(<Navbar />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();

      unmount();
    }
  });

  it('handles high-volume menu toggle interactions', () => {
    render(<Navbar />);

    const button = screen.getByRole('button', {
      name: /open menu/i,
    });

    for (let i = 0; i < 100; i++) {
      fireEvent.click(button);
    }

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('preserves navigation link structure across repeated renders', () => {
    const { container } = render(
      <>
        {Array.from({ length: 50 }).map((_, index) => (
          <div key={index}>
            <Navbar />
          </div>
        ))}
      </>
    );

    const navs = container.querySelectorAll('nav');

    expect(navs.length).toBe(50);
  });

  it('maintains acceptable render performance under heavy mount cycles', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i++) {
      const { unmount } = render(<Navbar />);
      unmount();
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('keeps mobile menu functionality stable after extensive interaction cycles', () => {
    render(<Navbar />);

    const menuButton = screen.getByRole('button', {
      name: /open menu/i,
    });

    for (let i = 0; i < 50; i++) {
      fireEvent.click(menuButton);
      fireEvent.click(menuButton);
    }

    expect(screen.getByRole('navigation')).toBeInTheDocument();

    expect(menuButton).toHaveAttribute('aria-expanded');
  });
});
