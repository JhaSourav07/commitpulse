import { themes } from '../../lib/svg/themes';

export type Scale = 'linear' | 'log';

export type ExportFormat = 'markdown' | 'html';

export type ThemeKey = Extract<keyof typeof themes, string>;

export type ThemeOption = ThemeKey | 'auto' | 'random';

// 'auto' and 'random' are virtual themes with no entries in the
// themes record, so they are added around the concrete presets.
export const THEME_KEYS: ThemeOption[] = ['auto', ...(Object.keys(themes) as ThemeKey[]), 'random'];

export const SPEEDS = [
  { value: '4s', label: 'Fast  (4s)' },
  { value: '8s', label: 'Default (8s)' },
  { value: '12s', label: 'Slow  (12s)' },
  { value: '20s', label: 'Ultra-slow (20s)' },
] as const;

export type BadgeSize = 'small' | 'medium' | 'large';

export const SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium (Default)' },
  { value: 'large', label: 'Large' },
] as const;

export const FONTS = [
  { value: '', label: 'Default' },
  { value: 'jetbrains', label: 'JetBrains Mono' },
  { value: 'fira', label: 'Fira Code' },
  { value: 'roboto', label: 'Roboto' },
] as const satisfies readonly { value: string; label: string }[];

export type Font = (typeof FONTS)[number]['value'];
