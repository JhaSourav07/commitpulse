import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Navbar from './navbar';

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('./theme-switch', () => ({
  useThemeToggle: vi.fn(),
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

import { useThemeToggle } from './theme-switch';

const mockedTheme = vi.mocked(useThemeToggle);

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('Navbar theme contrast', () => {
  it('renders navbar in light mode', () => {
    mockedTheme.mockReturnValue({
      animationName: 'circle',
      isDark: false,
      mounted: true,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<Navbar />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders navbar in dark mode', () => {
    mockedTheme.mockReturnValue({
      animationName: 'circle',
      isDark: true,
      mounted: true,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<Navbar />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('contains light and dark background contrast classes', () => {
    mockedTheme.mockReturnValue({
      animationName: 'circle',
      isDark: false,
      mounted: true,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<Navbar />);

    const header = screen.getByRole('banner');

    expect(header.innerHTML).toContain('bg-white');
    expect(header.innerHTML).toContain('dark:bg');
  });

  it('contains readable text contrast classes', () => {
    mockedTheme.mockReturnValue({
      animationName: 'circle',
      isDark: true,
      mounted: true,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<Navbar />);

    expect(document.body.innerHTML).toContain('dark:text');
    expect(document.body.innerHTML).toContain('text-white');
  });

  it('keeps theme toggle accessible in both themes', () => {
    mockedTheme.mockReturnValue({
      animationName: 'circle',
      isDark: false,
      mounted: true,
      setIsDark: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<Navbar />);

    const buttons = screen.getAllByRole('button', {
      name: 'Toggle theme',
    });

    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((button) => {
      expect(button).toBeVisible();
    });
  });
});
