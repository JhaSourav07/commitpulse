// lib/svg/constellationConstants.ts

/** SVG canvas dimensions for the constellation visualization. */
export const CONSTELLATION_SVG_WIDTH = 800;
export const CONSTELLATION_SVG_HEIGHT = 500;

/** Center point of the zodiac ring and starfield. */
export const CONSTELLATION_CENTER_X = 400;
export const CONSTELLATION_CENTER_Y = 240;

/** Zodiac ring dimensions. */
export const ZODIAC_RING_OUTER_R = 180;
export const ZODIAC_RING_INNER_R = 160;
export const ZODIAC_RING_STROKE_WIDTH = 1;

/** Radius at which month labels are placed (outside the ring). */
export const MONTH_LABEL_RADIUS = 202;

/** Bounding box for contribution star placement within the ring. */
export const STARFIELD_MIN_X = 140;
export const STARFIELD_MAX_X = 660;
export const STARFIELD_MIN_Y = 60;
export const STARFIELD_MAX_Y = 420;

/** Contribution star size range (radius in pixels). */
export const STAR_RADIUS_MIN = 1.5;
export const STAR_RADIUS_MAX = 5.5;

/** Background star count defaults. */
export const DEFAULT_BG_STAR_COUNT = 100;
export const MIN_BG_STAR_COUNT = 50;
export const MAX_BG_STAR_COUNT = 200;

/** Opacity range for contribution stars. */
export const STAR_OPACITY_MIN = 0.4;
export const STAR_OPACITY_MAX = 1.0;

/** Constellation line opacity. */
export const CONSTELLATION_LINE_OPACITY = 0.35;

/** Number of brightest stars to connect per month segment. */
export const BRIGHT_STARS_PER_MONTH = 3;

/** Label positions. */
export const USERNAME_LABEL_X = 30;
export const USERNAME_LABEL_Y = 40;
export const YEAR_LABEL_X = 770;
export const YEAR_LABEL_Y = 40;
export const SUBTITLE_X = 400;
export const SUBTITLE_Y = 475;
export const LEGEND_X = 30;
export const LEGEND_Y = 460;

/** CSS animation keyframe name prefix to avoid collisions. */
export const CSS_PREFIX = 'ck';

/** 3-letter month abbreviations (timezone-aware labels are computed at runtime). */
export const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];
