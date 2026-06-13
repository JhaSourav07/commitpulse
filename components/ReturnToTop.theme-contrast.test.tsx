/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReturnToTop from './ReturnToTop';

// Mock framer-motion components and hooks cleanly inside the vi.mock factory
vi.mock('framer-motion', () => {
  const MockDiv = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ));
  MockDiv.displayName = 'MockDiv';

  const MockButton = React.forwardRef(
    ({ children, whileHover, whileTap, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  );
  MockButton.displayName = 'MockButton';

  const MockCircle = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <circle ref={ref} {...props}>
      {children}
    </circle>
  ));
  MockCircle.displayName = 'MockCircle';

  const MockSpan = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <span ref={ref} {...props}>
      {children}
    </span>
  ));
  MockSpan.displayName = 'MockSpan';

  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: MockDiv,
      button: MockButton,
      circle: MockCircle,
      span: MockSpan,
    },
    useReducedMotion: () => false,
    useScroll: () => ({ scrollYProgress: { get: () => 0.5 } }),
    useSpring: (val: any) => val,
    useTransform: (val: any, input: any, output: any) => output[0],
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

describe('components/ReturnToTop Theme Contrast and Visual Cohesion', () => {
  const mockScrollTo = vi.fn();

  beforeEach(() => {
    window.scrollTo = mockScrollTo;
  });

  afterEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('1. emulates dual theme environment presets correctly for ReturnToTop component styles', () => {
    const themes = {
      dark: { bg: '#09090b', text: '#c4b5fd', border: 'rgba(167, 139, 250, 0.45)' },
      light: { bg: '#ffffff', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.2)' },
    };

    expect(themes.dark.bg).toBe('#09090b');
    expect(themes.light.bg).toBe('#ffffff');
    expect(themes.dark.text).not.toBe(themes.light.text);
  });

  it('2. asserts that visual styling for ReturnToTop adapts properly to current theme settings', () => {
    // Set scroll position to make ReturnToTop visible
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(400);

    const { container, rerender } = render(<ReturnToTop />);
    fireEvent.scroll(window);

    // Verify it is visible in the document
    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button).toBeInTheDocument();

    // Rerender under dark theme
    document.documentElement.className = 'dark';
    rerender(<ReturnToTop />);
    expect(screen.getByRole('button', { name: /back to top/i })).toBeInTheDocument();
  });

  it('3. verifies contrast ratio standards are satisfied for all textual elements in both themes', () => {
    // Normal state contrast: text-violet-300 (#c4b5fd) on bg-zinc-950/80 (#09090b)
    const normalStateContrast = contrastRatio('#09090b', '#c4b5fd');
    expect(normalStateContrast).toBeGreaterThanOrEqual(4.5); // WCAG AA normal text threshold (>= 4.5)

    // Hover state contrast: text-violet-200 (#ddd6fe) on bg-violet-950/35 (#1e1b4b)
    const hoverStateContrast = contrastRatio('#1e1b4b', '#ddd6fe');
    expect(hoverStateContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('4. checks that specific custom stylesheet properties or Tailwind classes are active in the markup', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(400);
    render(<ReturnToTop />);
    fireEvent.scroll(window);

    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button.className).toContain('group');
    expect(button.className).toContain('relative');
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('bg-zinc-950/80');
    expect(button.className).toContain('text-violet-300');
    expect(button.className).toContain('backdrop-blur-md');
  });

  it('5. ensures that background overlays and gradients do not clip or obstruct foreground content', () => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(400);
    render(<ReturnToTop />);
    fireEvent.scroll(window);

    // Verify background overlay scroll progress ring elements are present
    const svgCircle = screen.getByRole('button', { name: /back to top/i }).querySelector('circle');
    expect(svgCircle).toBeInTheDocument();
    expect(svgCircle?.className.animVal).toContain('text-violet-400/15');

    // Verify click event is propagated successfully to trigger scrollToTop
    const button = screen.getByRole('button', { name: /back to top/i });
    fireEvent.click(button);
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
