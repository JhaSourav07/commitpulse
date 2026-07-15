import { z } from 'zod';
import { BadgeTheme } from '../../types';
import { hexColor } from './sanitizer';

const HEX_COLOR_REGEX = /^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6,8}$/;

export const badgeThemeSchema = z.object({
  bg: z.string().regex(HEX_COLOR_REGEX, { message: 'Invalid bg color format' }),
  text: z.string().regex(HEX_COLOR_REGEX, { message: 'Invalid text color format' }),
  accent: z.string().regex(HEX_COLOR_REGEX, { message: 'Invalid accent color format' }),
  negative: z
    .string()
    .regex(HEX_COLOR_REGEX, { message: 'Invalid negative color format' })
    .optional(),
});

export function validateThemes(themesMap: Record<string, unknown>): void {
  for (const [name, theme] of Object.entries(themesMap)) {
    const result = badgeThemeSchema.safeParse(theme);
    if (!result.success) {
      throw new Error(`Theme validation failed for "${name}": ${result.error.message}`);
    }
  }
}

function makeTheme(bg: string, text: string, accent: string, negative?: string): BadgeTheme {
  return {
    bg: hexColor(bg),
    text: hexColor(text),
    accent: hexColor(accent),
    negative: negative ? hexColor(negative) : undefined,
  };
}

export const themes: Record<string, BadgeTheme> = {
  default: makeTheme('0d1117', 'ffffff', '2da44e', 'f85149'),
  dark: makeTheme('0d1117', 'c9d1d9', '58a6ff', 'f85149'),
  light: makeTheme('ffffff', '24292f', '0969da', 'cf222e'),
  neon: makeTheme('000000', '00ffcc', 'ff00ff', 'ff0055'),
  github: makeTheme('0d1117', 'ffffff', '238636', 'f85149'),
  dracula: makeTheme('282a36', 'f8f8f2', 'bd93f9', 'ff5555'),
  ocean: makeTheme('0a192f', 'ccd6f6', '64ffda', 'ff6b6b'),
  sunset: makeTheme('1a0a0a', 'ffd6c0', 'ff6b35', 'ff4d4d'),
  forest: makeTheme('0d1f0d', 'c8f0c8', '39d353', 'ff6b6b'),
  rose: makeTheme('1f0d14', 'f0c8d4', 'ff6b9d', 'ff4b72'),
  nord: makeTheme('2e3440', 'd8dee9', '88c0d0', 'bf616a'),
  synthwave: makeTheme('0d0221', 'f8f8f2', 'ff2d78', 'ff3864'),
  gruvbox: makeTheme('282828', 'ebdbb2', 'fe8019', 'fb4934'),
  aurora_cyberpunk: makeTheme('090B13', 'EAF2FF', '9D5CFF', 'FF3366'),
  highcontrast: makeTheme('0a0a0a', 'ffffff', 'ff4500', 'ff3333'),
  catppuccin_latte: makeTheme('eff1f5', '4c4f69', '1e66f5', 'd20f39'),
  solarized_light: makeTheme('fdf6e3', '586e75', '268bd2', 'dc322f'),
  gruvbox_light: makeTheme('fbf1c7', '3c3836', 'd65d0e', '9d0006'),
  nord_light: makeTheme('eceff4', '2e3440', '5e81ac', 'bf616a'),
  obsidian: makeTheme('1a1a2e', 'e2e8f0', 'f59e0b'),
  'cyber-pulse': makeTheme('000000', 'ffffff', '00ffee', 'ff0055'),
  'retro-terminal': makeTheme('000000', '00ff41', '00ff41', '00aa2b'),
  glacier: makeTheme('e0f2fe', '0369a1', '06b6d4', 'ef4444'),
  lumos: makeTheme('0a0a0a', 'a7f3d0', 'fbbf24', 'ef4444'),
  tokyonight: makeTheme('1a1b26', 'c0caf5', 'f7768e'),
  cyberpunk: makeTheme('fce22a', '111111', 'ff003c', '2d0000'),
  cyberpunk_neon: makeTheme('0d0d14', '00f3ff', 'ff0055', 'b800ff'),
  tokyo_night: makeTheme('1a1b26', 'c0caf5', '7aa2f7'),
  monokai: makeTheme('272822', 'f8f8f2', 'a6e22e', 'f92672'),
  midnight_ocean: makeTheme('020c1b', 'ccd6f6', '0af5ff', 'ff4d6d'),
  enterprise: makeTheme('1a1a2e', 'e2e8f0', '6366f1', '8b5cf6'),
  // India theme — saffron accent (#FF9933), India green negative (#138808)
  india: makeTheme('0a0a0a', 'ffffff', 'FF9933', '138808'),
  ayu_mirage: makeTheme('212733', 'D9D7CE', 'FFCC66', 'FF3333'),
};

// Auto-theme pairs: the SVG switches between these two palettes
// using @media (prefers-color-scheme) so the badge adapts to the
// viewer's OS-level light/dark setting without any JavaScript.
export const AUTO_THEME_LIGHT: BadgeTheme = themes.light ?? themes.default;
export const AUTO_THEME_DARK: BadgeTheme = themes.dark ?? themes.default;

/**
 * Resolves a theme case-insensitively by matching the normalized user input
 * against the normalized theme registry keys. Returns the standard theme key.
 */
export function getNormalizedThemeKey(themeInput: string | undefined | null): string {
  if (!themeInput) return 'default'; // fallback key

  const target = themeInput.trim().toLowerCase();
  const matchedKey = Object.keys(themes).find((key) => key.toLowerCase() === target);

  return matchedKey || 'default';
}

validateThemes(themes);
