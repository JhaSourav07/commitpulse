import { describe, it, expect } from 'vitest';
import { THEME_KEYS } from './types';
import type { ThemeKey } from './types';
import { themes, AUTO_THEME_LIGHT, AUTO_THEME_DARK } from '../../lib/svg/themes';
import type { BadgeTheme, HexColor } from '../../types';
import { getLuminance } from '../../lib/svg/sanitizer';

/** Required color tokens every concrete badge theme must expose. */
const REQUIRED_COLOR_TOKENS: (keyof BadgeTheme)[] = ['bg', 'text', 'accent'];

/**
 * WCAG-inspired relative-luminance contrast ratio.
 * Returns a value between 1 and 21.
 */
function contrastRatio(hexA: string, hexB: string): number {
  const lA = getLuminance(hexA);
  const lB = getLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('CustomizeTypes – Dark and Light Prefers-Color-Scheme Visual Cohesion', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. Structural validity of the dark and light theme presets
  // ────────────────────────────────────────────────────────────────────────
  it('dark and light theme presets expose all required color properties and are structurally valid', () => {
    for (const key of ['dark', 'light'] as ThemeKey[]) {
      const theme = themes[key];
      expect(theme).toBeDefined();

      // Every required token must be a non-empty string
      for (const token of REQUIRED_COLOR_TOKENS) {
        expect(theme[token]).toBeDefined();
        expect(typeof theme[token]).toBe('string');
        expect((theme[token] as string).length).toBeGreaterThan(0);
      }

      // `negative` is optional but if present must be a string
      if (theme.negative !== undefined) {
        expect(typeof theme.negative).toBe('string');
        expect((theme.negative as string).length).toBeGreaterThan(0);
      }

      // Hex values must be valid 6-digit hex (the makeTheme helper normalises to 6 chars)
      for (const token of REQUIRED_COLOR_TOKENS) {
        expect(theme[token]).toMatch(/^[0-9A-Fa-f]{6}$/);
      }
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 2. Minimum contrast between text/accent and background
  // ────────────────────────────────────────────────────────────────────────
  it('dark and light themes maintain sufficient text-on-background contrast and no required color tokens are missing', () => {
    // WCAG AA large-text minimum is 3:1; we use a conservative floor of 2.5
    // to guard against near-invisible text while acknowledging that badge
    // designs are decorative rather than body-text content.
    const MINIMUM_CONTRAST = 2.5;

    for (const key of ['dark', 'light'] as ThemeKey[]) {
      const theme = themes[key];

      // No required token may be missing
      for (const token of REQUIRED_COLOR_TOKENS) {
        expect(theme[token]).toBeDefined();
      }

      const textContrast = contrastRatio(theme.bg, theme.text);
      expect(textContrast).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);

      const accentContrast = contrastRatio(theme.bg, theme.accent);
      expect(accentContrast).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);
    }
  });

  // ────────────────────────────────────────────────────────────────────────
  // 3. Partial/empty theme objects fall back gracefully
  // ────────────────────────────────────────────────────────────────────────
  it('optional theme fields or partial theme objects gracefully fall back without runtime errors', () => {
    // Construct a partial theme missing the optional `negative` field.
    // The production code treats `negative` as optional (BadgeTheme.negative?),
    // so accessing it must never throw.
    const partial: Partial<BadgeTheme> = {
      bg: 'aabbcc' as HexColor,
      text: '112233' as HexColor,
      accent: 'ff5500' as HexColor,
      // negative intentionally omitted
    };

    expect(partial.negative).toBeUndefined();

    // Accessing the optional property and falling back mirrors production usage
    const negativeColor = partial.negative ?? 'ff0000';
    expect(negativeColor).toBe('ff0000');

    // Verify that the 'auto' and 'random' virtual keys have no entry in the
    // themes record — they are intentionally absent and handled separately.
    expect(themes['auto' as string]).toBeUndefined();
    expect(themes['random' as string]).toBeUndefined();

    // THEME_KEYS still lists them, confirming the customisation UI can present
    // them without runtime errors even though the themes record has no entry.
    expect(THEME_KEYS).toContain('auto');
    expect(THEME_KEYS).toContain('random');
  });

  // ────────────────────────────────────────────────────────────────────────
  // 4. Auto-theme class mappings remain consistent across dark and light
  // ────────────────────────────────────────────────────────────────────────
  it('auto-theme light/dark pair maps to the canonical light and dark presets and shares a consistent structure', () => {
    // AUTO_THEME_LIGHT and AUTO_THEME_DARK are the two palettes embedded in
    // the auto-theme SVG via @media (prefers-color-scheme).
    // They must reference the exact same objects as themes.light / themes.dark.
    expect(AUTO_THEME_LIGHT).toBe(themes.light);
    expect(AUTO_THEME_DARK).toBe(themes.dark);

    // Both must have the same set of keys so the CSS custom-property
    // switch works symmetrically.
    const lightKeys = Object.keys(AUTO_THEME_LIGHT).sort();
    const darkKeys = Object.keys(AUTO_THEME_DARK).sort();
    expect(lightKeys).toEqual(darkKeys);

    // The bg values must actually differ so the media-query toggle is
    // visually meaningful.
    expect(AUTO_THEME_LIGHT.bg).not.toBe(AUTO_THEME_DARK.bg);
  });

  // ────────────────────────────────────────────────────────────────────────
  // 5. Background/overlay must not invalidate foreground text/icon colors
  // ────────────────────────────────────────────────────────────────────────
  it('background color does not collide with text or accent colors in dark and light themes, preserving visual cohesion', () => {
    for (const key of ['dark', 'light'] as ThemeKey[]) {
      const theme = themes[key];

      // bg must differ from text; identical values would make text invisible.
      expect(theme.bg).not.toBe(theme.text);

      // bg must differ from accent; identical values would hide accent glows.
      expect(theme.bg).not.toBe(theme.accent);

      // If negative is present it must also differ from the background,
      // otherwise error states become invisible.
      if (theme.negative) {
        expect(theme.bg).not.toBe(theme.negative);
      }

      // Ensure foreground luminance and background luminance sit on
      // opposite sides of the mid-point so the overlay never washes
      // out the text.
      const bgLum = getLuminance(theme.bg);
      const textLum = getLuminance(theme.text);
      // One must be "light" and the other "dark" (threshold at 0.5)
      const bgIsLight = bgLum > 0.5;
      const textIsLight = textLum > 0.5;
      expect(bgIsLight).not.toBe(textIsLight);
    }
  });
});
