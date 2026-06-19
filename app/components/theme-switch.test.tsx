import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeToggleButton, useThemeToggle, createAnimation } from './theme-switch';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
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

describe('createAnimation', () => {
  it('generates correct animation name and CSS for circle variant', () => {
    const animation = createAnimation('circle', 'center');
    expect(animation.name).toBe('circle-center');
    expect(animation.css).toContain('clip-path: circle(');
  });

  it('generates correct CSS for rectangle variant', () => {
    const animation = createAnimation('rectangle', 'bottom-up');
    expect(animation.name).toBe('rectangle-bottom-up');
    expect(animation.css).toContain('polygon(0% 100%, 100% 100%');
  });

  it('generates correct CSS for gif variant', () => {
    const animation = createAnimation('gif', 'center', false, 'http://example.com/test.gif');
    expect(animation.name).toBe('gif-center');
    expect(animation.css).toContain("mask: url('http://example.com/test.gif')");
  });

  it('generates correct CSS for circle-blur variant', () => {
    const animation = createAnimation('circle-blur', 'top-right');
    expect(animation.name).toBe('circle-blur-top-right');
    expect(animation.css).toContain('mask: url(');
  });

  it('generates correct CSS for polygon variant', () => {
    const animation = createAnimation('polygon', 'top-right');
    expect(animation.name).toBe('polygon-top-right');
    expect(animation.css).toContain('clip-path: polygon(');
  });
});

describe('useThemeToggle hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('initializes to dark theme by default if localStorage is empty', () => {
    const { result } = renderHook(() => useThemeToggle());
    expect(result.current.isDark).toBe(true);
  });

  it('initializes based on localStorage preference', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useThemeToggle());
    expect(result.current.isDark).toBe(false);
  });

  it('persists theme class and color scheme on toggle', () => {
    const { result } = renderHook(() => useThemeToggle());

    act(() => {
      result.current.setIsDark(false);
    });

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');

    act(() => {
      result.current.setIsDark(true);
    });

    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('falls back to simple toggle if matchMedia matches prefers-reduced-motion', () => {
    vi.mocked(window.matchMedia).mockImplementationOnce((query) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useThemeToggle());

    act(() => {
      // First mount
      result.current.toggleTheme();
    });

    expect(result.current.isDark).toBe(false);
  });

  it('calls startViewTransition if available', () => {
    const startViewTransitionMock = vi.fn().mockImplementation((cb: () => void) => {
      cb();
      return { finished: Promise.resolve() };
    });

    Object.defineProperty(document, 'startViewTransition', {
      writable: true,
      configurable: true,
      value: startViewTransitionMock,
    });

    const { result } = renderHook(() => useThemeToggle());

    act(() => {
      result.current.toggleTheme();
    });

    expect(startViewTransitionMock).toHaveBeenCalled();
    expect(result.current.isDark).toBe(false);

    // Clean up
    delete (document as unknown as Record<string, unknown>).startViewTransition;
  });
});

describe('ThemeToggleButton Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders correctly', () => {
    render(<ThemeToggleButton />);
    const button = screen.getByRole('button', { name: /Toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('switches themes on click', () => {
    render(<ThemeToggleButton />);
    const button = screen.getByRole('button', { name: /Toggle theme/i });

    // Initial click toggles from dark (default) to light
    fireEvent.click(button);
    expect(localStorage.getItem('theme')).toBe('light');

    // Click again to toggle back to dark
    fireEvent.click(button);
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
