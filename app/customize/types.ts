import { themes } from '../../lib/svg/themes';

export type Scale = 'linear' | 'log';

export type ExportFormat = 'markdown' | 'html';

export type ThemeKey = Extract<keyof typeof themes, string>;

// 'auto' is a virtual theme that uses CSS prefers-color-scheme to
// switch between light and dark at runtime — it has no entry in the
// themes record, so we prepend it manually.
export const THEME_KEYS: (ThemeKey | 'auto')[] = ['auto', ...(Object.keys(themes) as ThemeKey[])];

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
