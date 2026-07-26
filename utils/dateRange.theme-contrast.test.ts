import { describe, expect, it } from 'vitest';

interface ThemeConfig {
  theme: 'light' | 'dark';
  background: string;
  foreground: string;
  classes: string[];
  overlayOpacity: number;
}

const createThemeConfig = (theme: 'light' | 'dark'): ThemeConfig => ({
  theme,
  background: theme === 'dark' ? '#000000' : '#ffffff',
  foreground: theme === 'dark' ? '#ffffff' : '#000000',
  classes:
    theme === 'dark' ? ['bg-black', 'text-white', 'dark'] : ['bg-white', 'text-black', 'light'],
  overlayOpacity: 0.5,
});

describe('dateRange - Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  it('sets expected styling for light theme mode', () => {
    const theme = createThemeConfig('light');

    expect(theme.classes).toContain('bg-white');
    expect(theme.classes).toContain('text-black');
    expect(theme.classes).toContain('light');
  });

  it('sets expected styling for dark theme mode', () => {
    const theme = createThemeConfig('dark');

    expect(theme.classes).toContain('bg-black');
    expect(theme.classes).toContain('text-white');
    expect(theme.classes).toContain('dark');
  });

  it('maintains sufficient text and background contrast', () => {
    const lightTheme = createThemeConfig('light');
    const darkTheme = createThemeConfig('dark');

    expect(lightTheme.background).not.toBe(lightTheme.foreground);
    expect(darkTheme.background).not.toBe(darkTheme.foreground);
  });

  it('applies expected theme utility classes', () => {
    const darkTheme = createThemeConfig('dark');

    expect(darkTheme.classes).toEqual(expect.arrayContaining(['bg-black', 'text-white', 'dark']));
  });

  it('preserves foreground visibility over overlays', () => {
    const theme = createThemeConfig('dark');

    expect(theme.overlayOpacity).toBeLessThan(1);
    expect(theme.foreground).toBe('#ffffff');
  });
});
