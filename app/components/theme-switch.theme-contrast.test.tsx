import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeToggleButton } from './theme-switch';

describe('theme-switch theme contrast behavior', () => {
  it('renders toggle button in light theme environment', () => {
    document.documentElement.classList.remove('dark');

    render(<ThemeToggleButton />);

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
  });

  it('renders toggle button in dark theme environment', () => {
    document.documentElement.classList.add('dark');

    render(<ThemeToggleButton />);

    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeTruthy();
  });

  it('contains expected light theme styling classes', () => {
    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', {
      name: /toggle theme/i,
    });

    expect(button.className).toContain('bg-gray-50');
    expect(button.className).toContain('text-gray-700');
  });

  it('contains expected dark theme styling classes', () => {
    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', {
      name: /toggle theme/i,
    });

    expect(button.className).toContain('dark:bg-white/5');
    expect(button.className).toContain('dark:text-white');
  });

  it('includes border and background classes that preserve contrast', () => {
    render(<ThemeToggleButton />);

    const button = screen.getByRole('button', {
      name: /toggle theme/i,
    });

    expect(button.className).toContain('border-gray-200');
    expect(button.className).toContain('dark:border-white/15');
    expect(button.className).toContain('dark:hover:bg-white/10');
  });
});
