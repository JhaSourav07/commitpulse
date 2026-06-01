import { describe, expect, it } from 'vitest';
import { themes, AUTO_THEME_LIGHT, AUTO_THEME_DARK } from './themes';

describe('themes', () => {
  it('validates every theme has bg, text, and accent as valid 6-character hex strings', () => {
    const hexRegex = /^#[0-9a-f]{6}$/i;

    Object.entries(themes).forEach(([name, theme]) => {
      // Validate every theme has bg, text, and accent
      expect(theme).toHaveProperty('bg');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('accent');

      // Assert they are valid 6-character hex strings using the requested regex.
      // We prepend '#' because the sanitizer strips it from the final object.
      expect(`#${theme.bg}`, `Theme "${name}" bg is invalid`).toMatch(hexRegex);
      expect(`#${theme.text}`, `Theme "${name}" text is invalid`).toMatch(hexRegex);
      expect(`#${theme.accent}`, `Theme "${name}" accent is invalid`).toMatch(hexRegex);

      // negative is optional, but if present, must be valid hex
      if (theme.negative) {
        expect(`#${theme.negative}`, `Theme "${name}" negative is invalid`).toMatch(hexRegex);
      }
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

  describe('new light theme variants', () => {
    it('asserts aurora_cyberpunk theme exists', () => {
      expect(themes).toHaveProperty('aurora_cyberpunk');
      expect(themes.aurora_cyberpunk).toBeDefined();
    });

    it('asserts aurora_cyberpunk has valid bg, text, accent hex values', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      const theme = themes.aurora_cyberpunk;

      expect(`#${theme.bg}`).toMatch(hexRegex);
      expect(`#${theme.text}`).toMatch(hexRegex);
      expect(`#${theme.accent}`).toMatch(hexRegex);
    });

    it('asserts catppuccin_latte theme exists', () => {
      expect(themes).toHaveProperty('catppuccin_latte');
      expect(themes.catppuccin_latte).toBeDefined();
    });

    it('asserts catppuccin_latte has valid bg, text, accent hex values', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      const theme = themes.catppuccin_latte;

      expect(`#${theme.bg}`).toMatch(hexRegex);
      expect(`#${theme.text}`).toMatch(hexRegex);
      expect(`#${theme.accent}`).toMatch(hexRegex);
    });

    it('asserts solarized_light theme exists', () => {
      expect(themes).toHaveProperty('solarized_light');
      expect(themes.solarized_light).toBeDefined();
    });

    it('asserts solarized_light has valid bg, text, accent hex values', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      const theme = themes.solarized_light;

      expect(`#${theme.bg}`).toMatch(hexRegex);
      expect(`#${theme.text}`).toMatch(hexRegex);
      expect(`#${theme.accent}`).toMatch(hexRegex);
    });

    it('asserts gruvbox_light theme exists', () => {
      expect(themes).toHaveProperty('gruvbox_light');
      expect(themes.gruvbox_light).toBeDefined();
    });

    it('asserts gruvbox_light has valid bg, text, accent hex values', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      const theme = themes.gruvbox_light;

      expect(`#${theme.bg}`).toMatch(hexRegex);
      expect(`#${theme.text}`).toMatch(hexRegex);
      expect(`#${theme.accent}`).toMatch(hexRegex);
    });

    it('asserts nord_light theme exists', () => {
      expect(themes).toHaveProperty('nord_light');
      expect(themes.nord_light).toBeDefined();
    });

    it('asserts nord_light has valid bg, text, accent hex values', () => {
      const hexRegex = /^#[0-9a-f]{6}$/i;
      const theme = themes.nord_light;

      expect(`#${theme.bg}`).toMatch(hexRegex);
      expect(`#${theme.text}`).toMatch(hexRegex);
      expect(`#${theme.accent}`).toMatch(hexRegex);
    });
  });

  describe('makeTheme produces HexColor branded types', () => {
    const hexRegex = /^[0-9a-f]{6}$/i;

    it('every theme bg matches hex regex', () => {
      Object.entries(themes).forEach(([name, theme]) => {
        expect(theme.bg, `theme "${name}" bg`).toMatch(hexRegex);
      });
    });

    it('every theme text matches hex regex', () => {
      Object.entries(themes).forEach(([name, theme]) => {
        expect(theme.text, `theme "${name}" text`).toMatch(hexRegex);
      });
    });

    it('every theme accent matches hex regex', () => {
      Object.entries(themes).forEach(([name, theme]) => {
        expect(theme.accent, `theme "${name}" accent`).toMatch(hexRegex);
      });
    });

    it('no theme value starts with #', () => {
      Object.entries(themes).forEach(([name, theme]) => {
        expect(theme.bg.startsWith('#'), `theme "${name}" bg starts with #`).toBe(false);
        expect(theme.text.startsWith('#'), `theme "${name}" text starts with #`).toBe(false);
        expect(theme.accent.startsWith('#'), `theme "${name}" accent starts with #`).toBe(false);
      });
    });
  });
});
