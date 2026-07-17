import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Navbar from './navbar';
import { useTranslation } from '@/context/TranslationContext';
import { usePathname } from 'next/navigation';
import { useThemeToggle } from './theme-switch';
import { useGlowEffect } from '@/hooks/useGlowEffect';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: vi.fn(),
  LANGUAGE_LABELS: { en: 'English', hi: 'Hindi' },
}));

vi.mock('./theme-switch', () => ({
  useThemeToggle: vi.fn(),
}));

vi.mock('@/hooks/useGlowEffect', () => ({
  useGlowEffect: vi.fn(),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/components/NavbarSearch', () => ({
  default: () => <div data-testid="navbar-search" />,
}));

vi.mock('@/components/KeyboardShortcutsModal', () => ({
  default: () => null,
}));

const mockT = vi.fn((key: string) => key);

describe('Navbar Hydration Stability', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      changeLanguage: vi.fn(),
      isPending: false,
    });
    vi.mocked(useThemeToggle).mockReturnValue({
      animationName: '',
      isDark: false,
      mounted: false,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });
    vi.mocked(useGlowEffect).mockReturnValue({
      shellRef: { current: null },
      shellVars: {},
      handleMouseEnter: vi.fn(),
      handleMouseMove: vi.fn(),
      handleMouseLeave: vi.fn(),
    });

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders a static, non-interactive language placeholder before mount, to avoid a hydration mismatch', () => {
    render(<Navbar />);

    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Select Language' })).not.toBeInTheDocument();
  });

  it('renders the real interactive language selector after the mount timer resolves', () => {
    render(<Navbar />);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getAllByRole('button', { name: 'Select Language' }).length).toBeGreaterThan(0);
  });

  it('renders an empty, same-sized placeholder for the theme icon before mount instead of Sun/Moon, avoiding layout shift', () => {
    render(<Navbar />);

    const themeToggleButtons = screen.getAllByLabelText('navbar.theme_toggle');
    themeToggleButtons.forEach((button) => {
      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  it('renders the real Sun/Moon icon once useThemeToggle reports mounted: true', () => {
    vi.mocked(useThemeToggle).mockReturnValue({
      animationName: '',
      isDark: false,
      mounted: true,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<Navbar />);

    const themeToggleButtons = screen.getAllByLabelText('navbar.theme_toggle');
    themeToggleButtons.forEach((button) => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });
});
