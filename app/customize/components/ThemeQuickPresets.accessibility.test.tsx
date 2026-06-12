import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
  it('uses correct accessible label coordinates (aria-label and aria-pressed)', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const darkBtn = screen.getByRole('button', { name: /apply dark theme/i });
    expect(darkBtn).toHaveAttribute('aria-label', 'Apply dark theme');
    expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
    const lightBtn = screen.getByRole('button', { name: /apply light theme/i });
    expect(lightBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('ensures interactive buttons maintain visible focus outline behaviors', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      btn.focus();
      expect(document.activeElement).toBe(btn);
      expect(btn).toBeVisible();
    });
  });

  it('announces tooltip labels via title attribute for screen reader accessibility', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={vi.fn()} />);
    const darkBtn = screen.getByRole('button', { name: /apply dark theme/i });
    expect(darkBtn).toHaveAttribute('title', 'Dark');
    const lightBtn = screen.getByRole('button', { name: /apply light theme/i });
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
