// lib/svg/themes.ts
import { BadgeTheme } from '../../types';
import { hexColor } from './sanitizer';

function makeTheme(bg: string, text: string, accent: string): BadgeTheme {
  return {
    bg: hexColor(bg),
    text: hexColor(text),
    accent: hexColor(accent),
  };
}

export const themes: Record<string, BadgeTheme> = {
  dark: makeTheme('0d1117', 'c9d1d9', '58a6ff'),
  light: makeTheme('ffffff', '24292f', '0969da'),
  neon: makeTheme('000000', '00ffcc', 'ff00ff'),
  github: makeTheme('0d1117', 'ffffff', '238636'),
  dracula: makeTheme('282a36', 'f8f8f2', 'bd93f9'),
  ocean: makeTheme('0a192f', 'ccd6f6', '64ffda'),
  sunset: makeTheme('1a0a0a', 'ffd6c0', 'ff6b35'),
  forest: makeTheme('0d1f0d', 'c8f0c8', '39d353'),
  rose: makeTheme('1f0d14', 'f0c8d4', 'ff6b9d'),
  nord: makeTheme('2e3440', 'd8dee9', '88c0d0'),
  synthwave: makeTheme('0d0221', 'f8f8f2', 'ff2d78'),
  gruvbox: makeTheme('282828', 'ebdbb2', 'fe8019'),
  aurora_cyberpunk: makeTheme('090B13', 'EAF2FF', '9D5CFF'),
  highcontrast: makeTheme('0a0a0a', 'ffffff', 'ff4500'),
  catppuccin_latte: makeTheme('eff1f5', '4c4f69', '1e66f5'),
  solarized_light: makeTheme('fdf6e3', '586e75', '268bd2'),
  gruvbox_light: makeTheme('fbf1c7', '3c3836', 'd65d0e'),
  nord_light: makeTheme('eceff4', '2e3440', '5e81ac'),
};

// Auto-theme pairs: the SVG switches between these two palettes
// using @media (prefers-color-scheme) so the badge adapts to the
// viewer's OS-level light/dark setting without any JavaScript.
export const AUTO_THEME_LIGHT: BadgeTheme = themes.light;
export const AUTO_THEME_DARK: BadgeTheme = themes.dark;
