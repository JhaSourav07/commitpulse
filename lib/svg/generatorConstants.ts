export const SVG_WIDTH = 600;
export const SVG_HEIGHT = 420;

import { FONT_MAP } from './fonts';

export type FontKey = keyof typeof FONT_MAP;

export function isFontKey(font: string): font is FontKey {
  return font in FONT_MAP;
}

/**
 * Maximum number of characters displayed in the username title before
 * truncation with '...'. Chosen to fit within SVG_WIDTH=600 at the
 * Syncopate font size of 18px with letter-spacing of 6px — approximately
 * 550px of text width, leaving comfortable edge margin on all badge sizes.
 *
 * Increasing this value may cause title overflow on small (400px) and
 * medium (600px) badges. Coordinate any change with SVG_WIDTH in this file.
 */
export const MAX_USERNAME_DISPLAY_LENGTH = 12;
