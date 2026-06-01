export const SVG_WIDTH = 600;
export const SVG_HEIGHT = 420;

import { FONT_MAP } from './fonts';

export type FontKey = keyof typeof FONT_MAP;

export function isFontKey(font: string): font is FontKey {
  return font in FONT_MAP;
}
