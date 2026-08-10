export const SVG_WIDTH = 600;
export const SVG_HEIGHT = 420;

import { FONT_MAP } from './fonts';

export type FontKey = keyof typeof FONT_MAP;

export function isFontKey(font: string): font is FontKey {
  return font in FONT_MAP;
}

/**
 * Maximum number of characters displayed in the username title before
 * truncation with '...'. Set to 39 to accommodate full GitHub usernames
 * (which can be up to 39 characters long) without truncation, utilizing dynamic
 * font scaling to fit safely within SVG cards.
 */
export const MAX_USERNAME_DISPLAY_LENGTH = 39;
