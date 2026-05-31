import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeQuickPresets } from './ThemeQuickPresets';
import { THEME_KEYS } from '../types';

const validKeys = THEME_KEYS.filter((k) => k !== 'auto' && k !== 'random');

describe('ThemeQuickPresets', () => {
  const onThemeChange = vi.fn();

  beforeEach(() => {
    onThemeChange.mockClear();
  });

  it('renders without crashing', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('renders a button for each valid theme key', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(validKeys.length);
  });

  it('active theme button has aria-pressed="true"', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const activeBtn = screen.getByRole('button', { name: /apply dark theme/i });
    expect(activeBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('inactive theme buttons have aria-pressed="false"', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const inactiveKey = validKeys.find((k) => k !== 'dark')!;
    const inactiveBtn = screen.getByRole('button', {
      name: new RegExp(`apply ${inactiveKey} theme`, 'i'),
    });
    expect(inactiveBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking a button calls onThemeChange with correct theme key', async () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const inactiveKey = validKeys.find((k) => k !== 'dark')!;
    const inactiveBtn = screen.getByRole('button', {
      name: new RegExp(`apply ${inactiveKey} theme`, 'i'),
    });
    fireEvent.click(inactiveBtn);
    expect(onThemeChange).toHaveBeenCalledWith(inactiveKey);
  });

  it('each button has an aria-label starting with "Apply"', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toMatch(/^Apply/i);
    });
  });

  it('renders at least one button for each concrete theme excluding auto and random', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    validKeys.forEach((key) => {
      const btn = screen.getByRole('button', {
        name: new RegExp(`apply ${key} theme`, 'i'),
      });
      expect(btn).toBeTruthy();
    });
  });

  it('switching active theme updates aria-pressed correctly', () => {
    const { rerender } = render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    const darkBtn = screen.getByRole('button', { name: /apply dark theme/i });
    expect(darkBtn.getAttribute('aria-pressed')).toBe('true');

    rerender(<ThemeQuickPresets theme="neon" onThemeChange={onThemeChange} />);
    const neonBtn = screen.getByRole('button', { name: /apply neon theme/i });
    expect(neonBtn.getAttribute('aria-pressed')).toBe('true');
    expect(darkBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('does not render buttons for auto or random themes', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);
    expect(screen.queryByRole('button', { name: /apply auto theme/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /apply random theme/i })).toBeNull();
  });
});

describe('ThemeQuickPresets responsive rendering', () => {
  const onThemeChange = vi.fn();

  beforeEach(() => {
    onThemeChange.mockClear();
  });

  it('renders every preset with accessible labels, high-contrast styling, and wrap layout', () => {
    render(<ThemeQuickPresets theme="dark" onThemeChange={onThemeChange} />);

    const presetButtons = screen.getAllByRole('button', { name: /apply .+ theme/i });
    expect(presetButtons).toHaveLength(validKeys.length);

    expect(
      screen.getByRole('button', { name: /apply dark theme/i }).getAttribute('aria-pressed')
    ).toBe('true');

    const highContrastButton = screen.getByRole('button', { name: /apply highcontrast theme/i });
    expect(highContrastButton).toBeDefined();
    expect(highContrastButton.getAttribute('title')).toBe('Highcontrast');
    expect(highContrastButton.getAttribute('style')).toContain('rgb(10, 10, 10)');

    const grid = highContrastButton.closest('div');
    expect(grid).not.toBeNull();
    expect(grid?.style.display).toBe('flex');
    expect(grid?.style.flexWrap).toBe('wrap');
  });
});
