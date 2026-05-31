import { describe, expect, it } from 'vitest';
import { themes, AUTO_THEME_LIGHT, AUTO_THEME_DARK } from './themes';

describe('themes', () => {
  it('validates every theme has bg, text, accent, and negative as valid 6-character hex strings', () => {
    const hexRegex = /^#[0-9a-f]{6}$/i;

    Object.entries(themes).forEach(([name, theme]) => {
      // Validate every theme has bg, text, accent, and negative
      expect(theme).toHaveProperty('bg');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('accent');
      expect(theme).toHaveProperty('negative');

      // Assert they are valid 6-character hex strings using the requested regex.
      // We prepend '#' because the sanitizer strips it from the final object.
      expect(`#${theme.bg}`, `Theme "${name}" bg is invalid`).toMatch(hexRegex);
      expect(`#${theme.text}`, `Theme "${name}" text is invalid`).toMatch(hexRegex);
      expect(`#${theme.accent}`, `Theme "${name}" accent is invalid`).toMatch(hexRegex);
      expect(`#${theme.negative}`, `Theme "${name}" negative is invalid`).toMatch(hexRegex);
    });
  });

  it('asserts no two themes are identical', () => {
    const uniqueThemes = new Set<string>();

    Object.entries(themes).forEach(([name, theme]) => {
      // Create a unique fingerprint for each theme based on its colors
      const fingerprint = `${theme.bg}-${theme.text}-${theme.accent}`;

      // If the fingerprint already exists, this theme is a duplicate
      expect(uniqueThemes.has(fingerprint), `Theme "${name}" is a duplicate`).toBe(false);

      uniqueThemes.add(fingerprint);
    });
  });

  it('asserts auto themes match their respective light/dark counterparts', () => {
    // Assert strictly equal (===)
    expect(AUTO_THEME_LIGHT).toBe(themes.light);
    expect(AUTO_THEME_DARK).toBe(themes.dark);
  });
});
