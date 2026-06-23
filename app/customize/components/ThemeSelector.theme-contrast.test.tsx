import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';

vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('./ThemeQuickPresets', () => ({
  ThemeQuickPresets: () => <div data-testid="theme-quick-presets">Theme Presets</div>,
}));

describe('ThemeSelector Theme Contrast', () => {
  const onThemeChange = vi.fn();

  it('renders theme selector controls', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    expect(screen.getByText('customize.controls.theme_presets')).toBeInTheDocument();

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies light theme contrast classes to select element', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const select = screen.getByRole('combobox');

    expect(select).toHaveClass('bg-gray-100/80');
    expect(select).toHaveClass('border-black/10');
    expect(select).toHaveClass('text-black');
  });

  it('applies dark theme contrast classes to select element', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const select = screen.getByRole('combobox');

    expect(select).toHaveClass('dark:bg-white/[0.03]');
    expect(select).toHaveClass('dark:border-white/10');
    expect(select).toHaveClass('dark:text-white');
  });

  it('supports both light and dark color schemes', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const select = screen.getByRole('combobox');

    expect(select.className).toContain('[color-scheme:light]');
    expect(select.className).toContain('dark:[color-scheme:dark]');
  });

  it('renders theme preview information with contrast-aware text styling', () => {
    render(<ThemeSelector theme="dark" onThemeChange={onThemeChange} />);

    const helperText = screen.getByText('bg · accent · text');

    expect(helperText).toHaveClass('text-gray-500');
    expect(helperText).toHaveClass('dark:text-white/60');
  });
});
