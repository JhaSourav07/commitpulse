import { render, waitFor } from '@testing-library/react';
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

describe('Navbar Mock Integrations (translation pending state)', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/');
    vi.mocked(useThemeToggle).mockReturnValue({
      animationName: '',
      isDark: false,
      mounted: true,
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('visually disables the language selector while a translation service change is pending', async () => {
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      changeLanguage: vi.fn(),
      isPending: true,
    });

    const { container } = render(<Navbar />);

    await waitFor(() => {
      const pendingSelector = container.querySelector(
        '.relative.inline-flex.opacity-50.pointer-events-none'
      );
      expect(pendingSelector).toBeInTheDocument();
    });
  });

  it('does not disable the language selector when no translation change is pending', async () => {
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      language: 'en',
      changeLanguage: vi.fn(),
      isPending: false,
    });

    const { container } = render(<Navbar />);

    await waitFor(() => {
      expect(container.querySelector('button[aria-label="Select Language"]')).toBeInTheDocument();
    });

    const pendingSelector = container.querySelector(
      '.relative.inline-flex.opacity-50.pointer-events-none'
    );
    expect(pendingSelector).not.toBeInTheDocument();
  });
});
