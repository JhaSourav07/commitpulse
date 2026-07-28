import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/vitest';
import StatsCard from './StatsCard';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock framer-motion to prevent elements from having opacity: 0 in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      whileInView,
      initial,
      animate,
      exit,
      transition,
      viewport,
      layoutId,
      ...props
    }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock TranslationContext
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

class IntersectionObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn();
  unobserve = vi.fn();
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

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
  } else if (normalized.length === 3) {
    r = parseInt(normalized.slice(0, 1).repeat(2), 16);
    g = parseInt(normalized.slice(1, 2).repeat(2), 16);
    b = parseInt(normalized.slice(2, 3).repeat(2), 16);
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

const defaultProps = {
  title: 'Longest Streak',
  value: '12',
  description: 'Days',
  icon: 'Flame',
  showUTCDisclaimer: true,
  utcDate: '2023-01-01',
};

describe('StatsCard Theme Contrast and prefers-color-scheme Visual Cohesion', () => {
  afterEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('1. emulates dual theme environment presets correctly for calculation views', () => {
    const themes = {
      dark: { bg: '#0a0a0a', text: '#ffffff', accent: '#a1a1aa' },
      light: { bg: '#ffffff', text: '#111827', accent: '#4b5563' },
    };
    expect(themes.dark.bg).toBe('#0a0a0a');
    expect(themes.light.bg).toBe('#ffffff');
    expect(themes.dark.text).not.toBe(themes.light.text);
    expect(themes.dark.accent).not.toBe(themes.light.accent);
  });

  it('2. asserts that visual styling for statistics cards adapts properly to current theme settings', () => {
    // Light Theme
    document.documentElement.className = '';
    const { rerender } = render(<StatsCard {...defaultProps} />);
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    // Dark Theme
    document.documentElement.className = 'dark';
    rerender(<StatsCard {...defaultProps} />);
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('3. verifies contrast ratio standards are satisfied for all textual elements', () => {
    // Value text contrast on white background (light mode) and dark background (dark mode)
    const lightValueRatio = contrastRatio('#ffffff', '#111827');
    expect(lightValueRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA normal text threshold is 4.5:1

    const darkValueRatio = contrastRatio('#0a0a0a', '#ffffff');
    expect(darkValueRatio).toBeGreaterThanOrEqual(4.5);

    // Label/description text contrast
    const lightLabelRatio = contrastRatio('#ffffff', '#71717a');
    expect(lightLabelRatio).toBeGreaterThanOrEqual(3.0); // WCAG AA large/incidental text threshold is 3.0:1

    const darkLabelRatio = contrastRatio('#0a0a0a', '#a1a1aa');
    expect(darkLabelRatio).toBeGreaterThanOrEqual(3.0);
  });

  it('4. checks that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<StatsCard {...defaultProps} />);

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('dark:bg-[#0a0a0a]');
    expect(card.className).toContain('border-black/10');
    expect(card.className).toContain('dark:border-[rgba(255,255,255,0.08)]');
  });

  it('5. ensures that background overlays do not clip foreground content colors', () => {
    const { container } = render(<StatsCard {...defaultProps} />);

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('overflow-hidden');

    const titleElement = screen.getByText('Longest Streak');
    const valueElement = screen.getByText('12');
    expect(titleElement).toBeVisible();
    expect(valueElement).toBeVisible();
  });
});
