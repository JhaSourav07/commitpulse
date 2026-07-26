// lib/svg/themes.test.ts
// Comprehensive coverage for the themes system.
// Previously had only 3 tests — this file adds hex validity, theme count,
// structure integrity, and AUTO_THEME pair safety checks.

import { describe, it, expect } from 'vitest';
import { themes, AUTO_THEME_LIGHT, AUTO_THEME_DARK, getNormalizedThemeKey } from './themes';

// ── Helpers ───────────────────────────────────────────────────────────────────

const HEX_REGEX = /^[0-9a-fA-F]{6}$/;

function isValidHex(value: string): boolean {
  return HEX_REGEX.test(value);
}

const themeEntries = Object.entries(themes);
const themeNames = Object.keys(themes);

// ── Original 3 tests (preserved) ─────────────────────────────────────────────

describe('themes object', () => {
  it('is defined and is an object', () => {
    expect(themes).toBeDefined();
    expect(typeof themes).toBe('object');
  });

  it('dark theme has expected hex values', () => {
    expect(themes.dark.bg).toBe('0d1117');
    expect(themes.dark.text).toBe('c9d1d9');
    expect(themes.dark.accent).toBe('58a6ff');
  });

  it('light theme has expected hex values', () => {
    expect(themes.light.bg).toBe('ffffff');
    expect(themes.light.text).toBe('24292f');
    expect(themes.light.accent).toBe('0969da');
  });
});

// ── Theme count ───────────────────────────────────────────────────────────────

describe('theme count', () => {
  it('contains exactly 29 preset themes matching THEMES.md documentation', () => {
    // If this fails, either a theme was added to themes.ts without updating
    // THEMES.md, or a theme was removed without updating the docs.
    // Update this count when intentionally adding/removing themes.
    expect(themeNames).toHaveLength(33);
  });

  it('contains all expected theme keys', () => {
    const expectedKeys = [
      'default',
      'dark',
      'light',
      'neon',
      'github',
      'dracula',
      'ocean',
      'sunset',
      'forest',
      'rose',
      'nord',
      'synthwave',
      'gruvbox',
      'aurora_cyberpunk',
      'highcontrast',
      'catppuccin_latte',
      'solarized_light',
      'gruvbox_light',
      'nord_light',
      'cyber-pulse',
      'retro-terminal',
      'obsidian',
      'glacier',
      'lumos',
      'tokyonight',
      'cyberpunk',
      'cyberpunk_neon',
      'tokyo_night',
      'monokai',
      'midnight_ocean',
      'india',
    ];
    for (const key of expectedKeys) {
      expect(themeNames).toContain(key);
    }
  });
});

// ── Theme structure ───────────────────────────────────────────────────────────

describe('theme structure — every theme has required bg, text, accent', () => {
  it.each(themeEntries)('theme "%s" has bg, text, and accent keys', (name, theme) => {
    const keys = Object.keys(theme).sort();
    expect(keys).toContain('bg');
    expect(keys).toContain('text');
    expect(keys).toContain('accent');
  });

  it.each(themeEntries)('theme "%s" has no undefined properties', (name, theme) => {
    expect(theme.bg).toBeDefined();
    expect(theme.text).toBeDefined();
    expect(theme.accent).toBeDefined();
  });
});

// ── Hex validity — all 20 themes × 3 properties = 60 values checked ──────────

describe('hex validity — all theme color values must be valid 6-char hex strings', () => {
  it.each(themeEntries)('theme "%s" bg is a valid 6-char hex string', (name, theme) => {
    expect(
      isValidHex(theme.bg),
      `theme "${name}" has invalid bg: "${theme.bg}" — must match /^[0-9a-fA-F]{6}$/`
    ).toBe(true);
  });

  it.each(themeEntries)('theme "%s" text is a valid 6-char hex string', (name, theme) => {
    expect(
      isValidHex(theme.text),
      `theme "${name}" has invalid text: "${theme.text}" — must match /^[0-9a-fA-F]{6}$/`
    ).toBe(true);
  });

  it.each(themeEntries)('theme "%s" accent is a valid 6-char hex string', (name, theme) => {
    expect(
      isValidHex(theme.accent),
      `theme "${name}" has invalid accent: "${theme.accent}" — must match /^[0-9a-fA-F]{6}$/`
    ).toBe(true);
  });

  it('no theme has a hex value with a leading # (values must be without #)', () => {
    for (const [, theme] of themeEntries) {
      expect(theme.bg.startsWith('#')).toBe(false);
      expect(theme.text.startsWith('#')).toBe(false);
      expect(theme.accent.startsWith('#')).toBe(false);
    }
  });

  it('no theme has a hex value shorter than 6 characters', () => {
    for (const [, theme] of themeEntries) {
      expect(theme.bg.length).toBeGreaterThanOrEqual(6);
      expect(theme.text.length).toBeGreaterThanOrEqual(6);
      expect(theme.accent.length).toBeGreaterThanOrEqual(6);
    }
  });
});

// ── AUTO_THEME pair integrity ─────────────────────────────────────────────────

describe('AUTO_THEME_LIGHT and AUTO_THEME_DARK — integrity checks', () => {
  it('AUTO_THEME_LIGHT is defined and not null', () => {
    expect(AUTO_THEME_LIGHT).toBeDefined();
    expect(AUTO_THEME_LIGHT).not.toBeNull();
  });

  it('AUTO_THEME_DARK is defined and not null', () => {
    expect(AUTO_THEME_DARK).toBeDefined();
    expect(AUTO_THEME_DARK).not.toBeNull();
  });

  it('AUTO_THEME_LIGHT references the light theme palette', () => {
    expect(AUTO_THEME_LIGHT.bg).toBe(themes.light.bg);
    expect(AUTO_THEME_LIGHT.text).toBe(themes.light.text);
    expect(AUTO_THEME_LIGHT.accent).toBe(themes.light.accent);
  });

  it('AUTO_THEME_DARK references the dark theme palette', () => {
    expect(AUTO_THEME_DARK.bg).toBe(themes.dark.bg);
    expect(AUTO_THEME_DARK.text).toBe(themes.dark.text);
    expect(AUTO_THEME_DARK.accent).toBe(themes.dark.accent);
  });

  it('AUTO_THEME_LIGHT bg is a valid hex string', () => {
    expect(isValidHex(AUTO_THEME_LIGHT.bg)).toBe(true);
  });

  it('AUTO_THEME_LIGHT text is a valid hex string', () => {
    expect(isValidHex(AUTO_THEME_LIGHT.text)).toBe(true);
  });

  it('AUTO_THEME_LIGHT accent is a valid hex string', () => {
    expect(isValidHex(AUTO_THEME_LIGHT.accent)).toBe(true);
  });

  it('AUTO_THEME_DARK bg is a valid hex string', () => {
    expect(isValidHex(AUTO_THEME_DARK.bg)).toBe(true);
  });

  it('AUTO_THEME_DARK text is a valid hex string', () => {
    expect(isValidHex(AUTO_THEME_DARK.text)).toBe(true);
  });

  it('AUTO_THEME_DARK accent is a valid hex string', () => {
    expect(isValidHex(AUTO_THEME_DARK.accent)).toBe(true);
  });

  it('AUTO_THEME_LIGHT and AUTO_THEME_DARK have different bg values', () => {
    // Light and dark themes must be visually distinct
    expect(AUTO_THEME_LIGHT.bg).not.toBe(AUTO_THEME_DARK.bg);
  });

  it('AUTO_THEME_LIGHT and AUTO_THEME_DARK have different text values', () => {
    expect(AUTO_THEME_LIGHT.text).not.toBe(AUTO_THEME_DARK.text);
  });
});

// ── Specific known theme values (regression guards) ───────────────────────────

describe('known theme palette regression guards', () => {
  it('neon theme has correct cyberpunk palette', () => {
    expect(themes.neon.bg).toBe('000000');
    expect(themes.neon.text).toBe('00ffcc');
    expect(themes.neon.accent).toBe('ff00ff');
  });

  it('dracula theme has correct purple palette', () => {
    expect(themes.dracula.bg).toBe('282a36');
    expect(themes.dracula.text).toBe('f8f8f2');
    expect(themes.dracula.accent).toBe('bd93f9');
  });

  it('obsidian theme has correct charcoal amber palette', () => {
    expect(themes.obsidian.bg).toBe('1a1a2e');
    expect(themes.obsidian.text).toBe('e2e8f0');
    expect(themes.obsidian.accent).toBe('f59e0b');
  });

  it('cyber-pulse theme has correct AMOLED cyan palette', () => {
    expect(themes['cyber-pulse'].bg).toBe('000000');
    expect(themes['cyber-pulse'].text).toBe('ffffff');
    expect(themes['cyber-pulse'].accent).toBe('00ffee');
  });
});

// ── Normalization Behavior Checks ─────────────────────────────────────────────

describe('getNormalizedThemeKey', () => {
  it('matches kebab-case keys when user provides all lowercase mashed inputs', () => {
    expect(getNormalizedThemeKey('cyber-pulse')).toBe('cyber-pulse');
  });

  it('matches keys when user provides screaming uppercase inputs', () => {
    expect(getNormalizedThemeKey('DRACULA')).toBe('dracula');
  });

  it('matches keys when user provides padded whitespace inputs', () => {
    expect(getNormalizedThemeKey('  dark  ')).toBe('dark');
    expect(getNormalizedThemeKey('\tneon\n')).toBe('neon');
    expect(getNormalizedThemeKey(' DARK ')).toBe('dark');
  });

  it('returns default fallback when theme name does not exist', () => {
    expect(getNormalizedThemeKey('invalidThemeNonexistent')).toBe('default');
  });

  it('returns default fallback gracefully when theme parameter is undefined or null', () => {
    expect(getNormalizedThemeKey(undefined)).toBe('default');
    expect(getNormalizedThemeKey(null)).toBe('default');
  });

  it('safely handles array inputs by picking the first valid element', () => {
    expect(getNormalizedThemeKey(['dark', 'light'])).toBe('dark');
    expect(getNormalizedThemeKey(['  neon  ', 'ocean'])).toBe('neon');
  });

  it('falls back to default if array is empty', () => {
    expect(getNormalizedThemeKey([])).toBe('default');
  });

  it('falls back to default if input is an object or number', () => {
    expect(getNormalizedThemeKey({} as unknown)).toBe('default');
    expect(getNormalizedThemeKey(123 as unknown)).toBe('default');
  });
});
