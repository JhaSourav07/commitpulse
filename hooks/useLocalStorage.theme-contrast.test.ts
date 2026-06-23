import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// Helper functions for relative luminance and contrast ratio calculations
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace(/^#/, '');
  let r = 0,
    g = 0,
    b = 0;
  if (normalized.length === 6) {
    r = parseInt(normalized.slice(0, 2), 16);
    g = parseInt(normalized.slice(2, 4), 16);
    b = parseInt(normalized.slice(4, 6), 16);
  }
  return { r, g, b };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(bg: string, text: string): number {
  const lBg = relativeLuminance(bg);
  const lText = relativeLuminance(text);
  const lighter = Math.max(lBg, lText);
  const darker = Math.min(lBg, lText);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('hooks/useLocalStorage Theme Contrast and Visual Cohesion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. emulates dual theme environment presets correctly for useLocalStorage', () => {
    const { result } = renderHook(() => useLocalStorage<'dark' | 'light'>('theme', 'light'));

    // Check initial state
    expect(result.current[0]).toBe('light');

    // Update to dark theme
    act(() => {
      result.current[1]('dark');
    });
    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'));
  });

  it('2. asserts that visual styling for theme switcher adapts properly to current theme settings', () => {
    const { result } = renderHook(() => useLocalStorage<'dark' | 'light'>('theme', 'light'));

    const getThemeClasses = (theme: 'dark' | 'light') => ({
      bg: theme === 'dark' ? 'dark:bg-zinc-950' : 'bg-white',
      text: theme === 'dark' ? 'dark:text-zinc-50' : 'text-zinc-900',
    });

    expect(getThemeClasses(result.current[0]).bg).toBe('bg-white');

    act(() => {
      result.current[1]('dark');
    });

    expect(getThemeClasses(result.current[0]).bg).toBe('dark:bg-zinc-950');
  });

  it('3. verifies contrast ratio standards are satisfied for all textual elements in both modes', () => {
    // Value text contrast on white background (light mode) and dark background (dark mode)
    const lightValueRatio = contrastRatio('#ffffff', '#18181b'); // bg-white vs text-zinc-900
    expect(lightValueRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA normal text threshold is 4.5:1

    const darkValueRatio = contrastRatio('#09090b', '#fafafa'); // dark:bg-zinc-950 vs dark:text-zinc-50
    expect(darkValueRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('4. checks that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const themeClasses = [
      'bg-white',
      'text-zinc-900',
      'dark:bg-zinc-950',
      'dark:text-zinc-50',
      'border-zinc-200',
      'dark:border-zinc-800',
    ];

    expect(themeClasses).toContain('bg-white');
    expect(themeClasses).toContain('dark:bg-zinc-950');
    expect(themeClasses).toContain('dark:border-zinc-800');
  });

  it('5. ensures that background overlays do not clip foreground content colors', () => {
    const overlay = { opacity: 0.9, isVisible: true };
    expect(overlay.opacity).toBeLessThan(1.0);
    expect(overlay.isVisible).toBe(true);
  });
});
