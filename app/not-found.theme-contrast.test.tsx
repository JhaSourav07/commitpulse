import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import NotFound from './not-found';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');

  return {
    r: parseInt(normalized.substring(0, 2), 16),
    g: parseInt(normalized.substring(2, 4), 16),
    b: parseInt(normalized.substring(4, 6), 16),
  };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const values = [r, g, b].map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrastRatio(background: string, foreground: string) {
  const bg = relativeLuminance(background);
  const fg = relativeLuminance(foreground);

  const lighter = Math.max(bg, fg);
  const darker = Math.min(bg, fg);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('NotFound Theme Contrast & Visual Cohesion', () => {
  afterEach(() => {
    document.documentElement.className = '';
    vi.clearAllMocks();
  });

  it('renders correctly in both light and dark theme environments', () => {
    document.documentElement.className = '';

    const { rerender } = render(<NotFound />);

    expect(
      screen.getByRole('heading', {
        name: /looks like this commit got/i,
      })
    ).toBeInTheDocument();

    document.documentElement.className = 'dark';

    rerender(<NotFound />);

    expect(
      screen.getByRole('heading', {
        name: /looks like this commit got/i,
      })
    ).toBeInTheDocument();
  });

  it('verifies contrast ratio standards for primary text colors', () => {
    const whiteOnDark = contrastRatio('#050505', '#ffffff');

    expect(whiteOnDark).toBeGreaterThanOrEqual(7);

    const violetAccentContrast = contrastRatio('#050505', '#a78bfa');

    expect(violetAccentContrast).toBeGreaterThanOrEqual(4.5);

    const cyanAccentContrast = contrastRatio('#050505', '#38bdf8');

    expect(cyanAccentContrast).toBeGreaterThanOrEqual(4.5);
  });

  it('contains expected theme-aware tailwind styling classes', () => {
    const { container } = render(<NotFound />);

    const main = container.querySelector('main');

    expect(main).toBeInTheDocument();
    expect(main?.className).toContain('text-white');
    expect(main?.className).toContain('min-h-screen');
    expect(main?.className).toContain('overflow-x-hidden');

    expect(screen.getByText('Go back home')).toHaveClass('text-white/60');
  });

  it('preserves gradient and visual styling elements required for cohesion', () => {
    const { container } = render(<NotFound />);

    const gradientText = screen.getAllByText('𝒐𝒐𝒑𝒔')[1];

    expect(gradientText.className).toContain('bg-clip-text');
    expect(gradientText.className).toContain('text-transparent');

    const overlays = container.querySelectorAll('.pointer-events-none');

    expect(overlays.length).toBeGreaterThanOrEqual(2);
  });

  it('ensures background overlays do not remove foreground content visibility', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', {
        name: /looks like this commit got/i,
      })
    ).toBeVisible();

    expect(
      screen.getByRole('link', {
        name: /git checkout main/i,
      })
    ).toBeVisible();

    expect(
      screen.getByRole('link', {
        name: /go back home/i,
      })
    ).toBeVisible();
  });
});
