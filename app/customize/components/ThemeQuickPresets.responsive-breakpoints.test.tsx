import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeQuickPresets } from './ThemeQuickPresets';

describe('ThemeQuickPresets Responsive Breakpoints', () => {
  const originalWidth = window.innerWidth;

  const onThemeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth,
    });

    window.dispatchEvent(new Event('resize'));
  });

  function setViewport(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });

    window.dispatchEvent(new Event('resize'));
  }

  it('renders correctly on a mobile viewport (375px)', () => {
    setViewport(375);

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders the same preset buttons across viewport sizes', () => {
    setViewport(375);

    const { rerender } = render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    const mobileCount = screen.getAllByRole('button').length;

    setViewport(1280);

    rerender(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    expect(screen.getAllByRole('button')).toHaveLength(mobileCount);
  });

  it('does not introduce fixed-width layout issues on small screens', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    const container = screen.getAllByRole('button')[0].parentElement;

    expect(container).toBeTruthy();
    expect(container?.className).toContain('theme-quick-presets');
  });

  it('allows selecting a theme on mobile', () => {
    setViewport(375);

    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByLabelText(/apply light theme/i));

    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('keeps the active theme button accessible on small screens', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    expect(
      screen.getByRole('button', {
        name: /apply dark theme/i,
      })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
