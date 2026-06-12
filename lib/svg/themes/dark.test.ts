// lib/svg/themes/dark.test.ts
import { describe, it, expect } from 'vitest';
import { themes, AUTO_THEME_DARK } from '../themes';

describe('dark theme', () => {
  const dark = themes.dark;

  it('exists in the themes collection', () => {
    expect(dark).toBeDefined();
  });

  it('contains valid hexadecimal color values', () => {
    const hexRegex = /^[0-9A-Fa-f]{6}$/;

    expect(dark.bg).toMatch(hexRegex);
    expect(dark.text).toMatch(hexRegex);
    expect(dark.accent).toMatch(hexRegex);

    if (dark.negative) {
      expect(dark.negative).toMatch(hexRegex);
    }
  });

  it('uses the expected dark theme colors', () => {
    expect(dark.bg).toBe('0d1117');
    expect(dark.text).toBe('c9d1d9');
    expect(dark.accent).toBe('58a6ff');
    expect(dark.negative).toBe('f85149');
  });

  it('is configured as AUTO_THEME_DARK', () => {
    expect(AUTO_THEME_DARK).toBe(themes.dark);
  });

  it('provides all required dark theme properties', () => {
    expect(dark).toHaveProperty('bg');
    expect(dark).toHaveProperty('text');
    expect(dark).toHaveProperty('accent');
    expect(dark).toHaveProperty('negative');
  });
});
