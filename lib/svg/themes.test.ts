import { describe, expect, it } from 'vitest';
import { themes, AUTO_THEME_LIGHT, AUTO_THEME_DARK } from './themes';

describe('themes', () => {
  it('should not use # prefix in background colors', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.bg.startsWith('#')).toBe(false);
    });
  });

  it('should not use # prefix in text colors', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.text.startsWith('#')).toBe(false);
    });
  });

  it('should not use # prefix in accent colors', () => {
    Object.values(themes).forEach((theme) => {
      expect(theme.accent.startsWith('#')).toBe(false);
    });
  });
  it('AUTO_THEME_LIGHT references themes.light', () => {
    expect(AUTO_THEME_LIGHT).toBe(themes.light);
  });

  it('AUTO_THEME_DARK references themes.dark', () => {
    expect(AUTO_THEME_DARK).toBe(themes.dark);
  });

  it('AUTO_THEME_LIGHT bg matches themes.light.bg', () => {
    expect(AUTO_THEME_LIGHT.bg).toBe(themes.light.bg);
  });

  it('AUTO_THEME_DARK accent matches themes.dark.accent', () => {
    expect(AUTO_THEME_DARK.accent).toBe(themes.dark.accent);
  });
});
