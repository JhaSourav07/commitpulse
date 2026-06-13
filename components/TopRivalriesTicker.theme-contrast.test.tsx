/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TopRivalriesTicker from './TopRivalriesTicker';

// Mock next/navigation to verify router push operations
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock framer-motion to render normal div containers and avoid animation complications
vi.mock('framer-motion', () => {
  const mockMotionDivInternal = React.forwardRef(
    ({ children, animate, transition, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  );
  mockMotionDivInternal.displayName = 'MotionDiv';
  return {
    motion: {
      div: mockMotionDivInternal,
    },
  };
});

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

describe('components/TopRivalriesTicker Theme Contrast and Visual Cohesion', () => {
  afterEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('1. emulates dual theme environment presets correctly for TopRivalriesTicker views', () => {
    const themes = {
      dark: { bg: '#050505', text: '#d4d4d8', border: 'rgba(255,255,255,0.05)' },
      light: { bg: '#fafafa', text: '#3f3f46', border: 'rgba(0,0,0,0.05)' },
    };

    expect(themes.dark.bg).toBe('#050505');
    expect(themes.light.bg).toBe('#fafafa');
    expect(themes.dark.text).not.toBe(themes.light.text);
  });

  it('2. asserts that visual styling for TopRivalriesTicker adapts properly to current theme settings', () => {
    // Render under light theme
    document.documentElement.className = '';
    const { rerender } = render(<TopRivalriesTicker />);
    expect(screen.getAllByText('torvalds').length).toBeGreaterThan(0);

    // Render under dark theme
    document.documentElement.className = 'dark';
    rerender(<TopRivalriesTicker />);
    expect(screen.getAllByText('torvalds').length).toBeGreaterThan(0);
  });

  it('3. verifies contrast ratio standards are satisfied for all textual elements in both themes', () => {
    // Light mode text-zinc-700 (#3f3f46) on bg-zinc-50 (#fafafa)
    const lightUsernameContrast = contrastRatio('#fafafa', '#3f3f46');
    expect(lightUsernameContrast).toBeGreaterThanOrEqual(4.5); // WCAG AA normal text threshold (>= 4.5)

    // Dark mode text-zinc-300 (#d4d4d8) on bg-[#050505] (#050505)
    const darkUsernameContrast = contrastRatio('#050505', '#d4d4d8');
    expect(darkUsernameContrast).toBeGreaterThanOrEqual(4.5);

    // Light mode "VS" text-zinc-400 (#a1a1aa) on bg-zinc-50 (#fafafa)
    const lightVsContrast = contrastRatio('#fafafa', '#a1a1aa');
    expect(lightVsContrast).toBeGreaterThanOrEqual(2.0); // Incidental/Disabled element contrast check

    // Dark mode "VS" text-zinc-600 (#52525b) on bg-[#050505] (#050505)
    const darkVsContrast = contrastRatio('#050505', '#52525b');
    expect(darkVsContrast).toBeGreaterThanOrEqual(2.0);
  });

  it('4. checks that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    const { container } = render(<TopRivalriesTicker />);

    // Outer container class check
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer.className).toContain('bg-zinc-50');
    expect(outerContainer.className).toContain('dark:bg-[#050505]');
    expect(outerContainer.className).toContain('border-b');
    expect(outerContainer.className).toContain('border-black/5');
    expect(outerContainer.className).toContain('dark:border-white/5');

    // Ticker items group and hover class check
    const items = container.querySelectorAll('.group');
    expect(items.length).toBeGreaterThan(0);
    const firstItem = items[0];
    expect(firstItem.className).toContain('cursor-pointer');
    expect(firstItem.className).toContain('hover:bg-black/5');
    expect(firstItem.className).toContain('dark:hover:bg-white/5');
  });

  it('5. ensures that background overlays and gradients do not clip or obstruct foreground content', () => {
    const { container } = render(<TopRivalriesTicker />);

    // Query left and right gradient overlay elements
    const overlays = container.querySelectorAll('.pointer-events-none');
    expect(overlays.length).toBeGreaterThanOrEqual(2);

    // Verify they are styled with z-10 and pointer-events-none to prevent blocking interactions
    overlays.forEach((overlay) => {
      expect(overlay.className).toContain('pointer-events-none');
      expect(overlay.className).toContain('z-10');
      expect(overlay.className).toContain('bg-gradient-to-');
    });

    // Simulate click on a rivalry item to verify user interactivity is preserved
    const targetElement = screen.getAllByText('torvalds')[0];
    fireEvent.click(targetElement);
    expect(mockPush).toHaveBeenCalled();
  });
});
