import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { THEME_KEYS } from '../types';
import { ThemeSelector } from './ThemeSelector';

describe('ThemeSelector mouse interactivity (Variation 5)', () => {
  it('changes theme through the native selector interaction', () => {
    const onThemeChange = vi.fn();

    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.change(screen.getByDisplayValue('Dark'), {
      target: { value: 'neon' },
    });

    expect(onThemeChange).toHaveBeenCalledWith('neon');
  });

  it('selects a concrete non-virtual theme when shuffle is clicked', () => {
    const onThemeChange = vi.fn();

    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /shuffle/i }));

    expect(onThemeChange).toHaveBeenCalledTimes(1);

    const selectedTheme = onThemeChange.mock.calls[0][0];

    expect(THEME_KEYS).toContain(selectedTheme);
    expect(selectedTheme).not.toBe('auto');
    expect(selectedTheme).not.toBe('random');
  });

  it('renders auto theme runtime helper text and split swatch state', () => {
    render(<ThemeSelector theme="auto" onThemeChange={vi.fn()} />);

    expect(screen.getByText(/switches with OS theme/i)).toBeTruthy();

    const autoSwatch = screen.getByTitle(/Light.*Dark.*auto/i);

    expect(autoSwatch).toBeTruthy();
    expect(autoSwatch.querySelectorAll('span')).toHaveLength(2);
  });

  it('renders random theme runtime swatch samples', () => {
    render(<ThemeSelector theme="random" onThemeChange={vi.fn()} />);

    expect(screen.getByText(/changes on each load/i)).toBeTruthy();
    expect(screen.getByTitle(/Random accent sample 1/i)).toBeTruthy();
    expect(screen.getByTitle(/Random accent sample 2/i)).toBeTruthy();
    expect(screen.getByTitle(/Random accent sample 3/i)).toBeTruthy();
  });

  it('updates rendered swatch state when the selected theme prop changes', () => {
    const { rerender } = render(<ThemeSelector theme="dark" onThemeChange={vi.fn()} />);

    expect(screen.getByText(/bg/i)).toBeTruthy();
    expect(screen.getByTitle(/bg:/i)).toBeTruthy();

    rerender(<ThemeSelector theme="random" onThemeChange={vi.fn()} />);

    expect(screen.getByText(/changes on each load/i)).toBeTruthy();
    expect(screen.queryByTitle(/^bg:/i)).toBeNull();
  });
});
