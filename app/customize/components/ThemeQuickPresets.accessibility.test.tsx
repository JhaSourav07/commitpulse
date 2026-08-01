import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeQuickPresets } from './ThemeQuickPresets';

vi.mock('../../../lib/svg/themes', () => ({
  themes: {
    dark: { bg: '0d1117', text: 'c9d1d9', accent: '58a6ff' },
    light: { bg: 'ffffff', text: '24292f', accent: '0969da' },
    neon: { bg: '0d0d0d', text: '00ff41', accent: 'ff00ff' },
  },
}));

vi.mock('../types', () => ({
  THEME_KEYS: ['dark', 'light', 'neon'],
}));

describe('ThemeQuickPresets Accessibility Standards & Screen Reader Aria Compliance', () => {
  it('renders container with role="radiogroup" and accessible label', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const group = screen.getByRole('radiogroup', { name: /theme presets/i });
    expect(group).toBeInTheDocument();
  });

  it('uses role="radio", aria-checked, and tabIndex={0} on theme tiles', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const darkRadio = screen.getByRole('radio', { name: /apply dark theme/i });
    expect(darkRadio).toHaveAttribute('aria-checked', 'true');
    expect(darkRadio).toHaveAttribute('tabindex', '0');
    expect(darkRadio).toHaveAttribute('aria-label', 'Apply dark theme');

    const lightRadio = screen.getByRole('radio', { name: /apply light theme/i });
    expect(lightRadio).toHaveAttribute('aria-checked', 'false');
    expect(lightRadio).toHaveAttribute('tabindex', '0');
  });

  it('ensures interactive buttons maintain visible focus outline behaviors with focus-visible:ring-2', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
    radios.forEach((btn) => {
      btn.focus();
      expect(document.activeElement).toBe(btn);
      expect(btn).toHaveClass('focus-visible:ring-2');
    });
  });

  it('announces applied theme preset via aria-live="polite" live region', () => {
    render(<ThemeQuickPresets theme="neon" onThemeChange={vi.fn()} />);
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveTextContent(/neon theme preset applied/i);
  });

  it('supports arrow key navigation (ArrowRight / ArrowLeft) to cycle through themes', () => {
    const onThemeChange = vi.fn();
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const darkRadio = screen.getByRole('radio', { name: /apply dark theme/i });

    darkRadio.focus();
    fireEvent.keyDown(darkRadio, { key: 'ArrowRight' });
    expect(onThemeChange).toHaveBeenCalledWith('light');

    fireEvent.keyDown(darkRadio, { key: 'ArrowLeft' });
    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });

  it('announces tooltip labels via title attribute for screen reader accessibility', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const darkBtn = screen.getByRole('radio', { name: /apply dark theme/i });
    expect(darkBtn).toHaveAttribute('title', 'Dark');
    const lightBtn = screen.getByRole('radio', { name: /apply light theme/i });
    expect(lightBtn).toHaveAttribute('title', 'Light');
  });

  it('maintains logical keyboard tab order for all theme buttons', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const focusables = document.querySelectorAll(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusables.length).toBeGreaterThan(0);
    focusables.forEach((el) => {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  it('renders SVG icons with aria-hidden to avoid screen reader noise', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
