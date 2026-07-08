import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './navbar';
import { useTranslation } from '@/context/TranslationContext';
import { useThemeToggle } from './theme-switch';
import { usePathname } from 'next/navigation';
import '@testing-library/jest-dom';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: vi.fn(),
  LANGUAGE_LABELS: {
    en: 'English',
    es: 'Español',
  },
}));

vi.mock('./theme-switch', () => ({
  useThemeToggle: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/hooks/useSiteSearch', () => ({
  useSiteSearch: vi.fn().mockReturnValue({
    query: '',
    setQuery: vi.fn(),
    results: [],
    hasQuery: false,
    clear: vi.fn(),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="MenuIcon">MenuIcon</div>,
  X: () => <div data-testid="CloseIcon">CloseIcon</div>,
  Activity: () => <div>ActivityIcon</div>,
  Globe: () => <div>GlobeIcon</div>,
  Sun: () => <div>SunIcon</div>,
  Moon: () => <div>MoonIcon</div>,
  Search: () => <div>SearchIcon</div>,
  ArrowRight: () => <div>ArrowRightIcon</div>,
  ChevronDown: () => <div>ChevronDownIcon</div>,
  Check: () => <div>CheckIcon</div>,
  Keyboard: () => <div>KeyboardIcon</div>,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
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

describe('Navbar - Edge Cases & Empty/Missing Inputs Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Case 1: renders target component with default empty/unconfigured parameters', () => {
    vi.mocked(usePathname).mockReturnValue(null as unknown as string);
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (key: string) => key,
      isPending: false,
    });
    vi.mocked(useThemeToggle).mockReturnValue({
      isDark: true,
      mounted: true,
      toggleTheme: vi.fn(),
      animationName: 'circle',
      setIsDark: vi.fn(),
    });

    render(<Navbar />);

    // Verify component renders without crashing
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Verify home link exists using translated key label as fallback
    const homeLink = screen.getByRole('link', { name: 'navbar.home' });
    expect(homeLink).toBeInTheDocument();
  });

  it('Case 2: verifies that a clear, non-breaking fallback UI or message is displayed', () => {
    // Mocks translation keys to return raw path strings as fallback
    vi.mocked(usePathname).mockReturnValue('/');
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (key: string) => key,
      isPending: false,
    });
    vi.mocked(useThemeToggle).mockReturnValue({
      isDark: true,
      mounted: true,
      toggleTheme: vi.fn(),
      animationName: 'circle',
      setIsDark: vi.fn(),
    });

    render(<Navbar />);

    // Check that link text resolves to raw path keys as fallback UI
    expect(screen.getByText('navbar.generator')).toBeInTheDocument();
    expect(screen.getByText('navbar.compare')).toBeInTheDocument();
    expect(screen.getByText('navbar.burnout_radar')).toBeInTheDocument();
  });

  it('Case 3: verifies standard layout styles are maintained in default empty layout state', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (key: string) => key,
      isPending: false,
    });
    vi.mocked(useThemeToggle).mockReturnValue({
      isDark: true,
      mounted: true,
      toggleTheme: vi.fn(),
      animationName: 'circle',
      setIsDark: vi.fn(),
    });

    render(<Navbar />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
    expect(header).toHaveClass('z-50');
    expect(header).toHaveClass('w-full');
  });

  it('Case 4: asserts that no unexpected runtime errors or hydration failures occur', () => {
    // Hydration starts with mounted = false
    const mockToggleTheme = vi.fn();
    vi.mocked(useThemeToggle).mockReturnValue({
      isDark: false,
      mounted: false,
      toggleTheme: mockToggleTheme,
      animationName: 'circle',
      setIsDark: vi.fn(),
    });

    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: (key: string) => key,
      isPending: false,
    });

    const { rerender } = render(<Navbar />);

    // Language selector shows default English fallback when mounted is false
    expect(screen.getByText('English')).toBeInTheDocument();

    // Now set mounted = true to simulate post-hydration mount
    vi.mocked(useThemeToggle).mockReturnValue({
      isDark: true,
      mounted: true,
      toggleTheme: mockToggleTheme,
      animationName: 'circle',
      setIsDark: vi.fn(),
    });

    rerender(<Navbar />);

    // Renders successfully without any runtime crashes
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('Case 5: checks key DOM structures to make sure key markers exist', () => {
    // Mocks translation response to return empty strings
    vi.mocked(useTranslation).mockReturnValue({
      language: 'en',
      changeLanguage: vi.fn(),
      t: () => '',
      isPending: false,
    });
    vi.mocked(useThemeToggle).mockReturnValue({
      isDark: true,
      mounted: true,
      toggleTheme: vi.fn(),
      animationName: 'circle',
      setIsDark: vi.fn(),
    });

    render(<Navbar />);

    // Checks that navigation role exists
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // Verify key link tags are rendered even if their text content is empty
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
