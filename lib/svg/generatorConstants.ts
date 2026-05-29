export const SVG_WIDTH = 600;
export const SVG_HEIGHT = 420;

export const FONT_MAP = {
  jetbrains: '"JetBrains Mono", monospace',
  fira: '"Fira Code", monospace',
  roboto: '"Roboto", sans-serif',
} as const;

export type FontKey = keyof typeof FONT_MAP;

export function isFontKey(font: string): font is FontKey {
  return font in FONT_MAP;
}
