export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');

  // Accept the same hex formats the rest of the app allows (see HEX_COLOR_REGEX
  // in lib/svg/themes.ts): 3/4-digit shorthand and 6/8-digit full hex. Shorthand
  // digits are expanded (e.g. "abc" -> "aabbcc") and any trailing alpha channel
  // is ignored so contrast/HSL helpers work on every accepted color, not just 6-digit.
  let normalized: string;
  if (/^[0-9a-fA-F]{3,4}$/.test(cleaned)) {
    normalized = cleaned
      .slice(0, 3)
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (/^[0-9a-fA-F]{6,8}$/.test(cleaned)) {
    normalized = cleaned.slice(0, 6);
  } else {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 50 };
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function getContrastRating(ratio: number): {
  label: string;
  level: 'pass' | 'warn' | 'fail';
} {
  if (ratio >= 7) return { label: 'AAA', level: 'pass' };
  if (ratio >= 4.5) return { label: 'AA', level: 'pass' };
  if (ratio >= 3) return { label: 'AA Large', level: 'warn' };
  return { label: 'Fail', level: 'fail' };
}

export function findAccessibleColor(
  baseHex: string,
  text: 'white' | 'black',
  targetRatio = 4.5
): string {
  const bg = text === 'white' ? '#ffffff' : '#000000';
  const base = hexToHsl(baseHex);
  let best = baseHex;
  for (let l = 0; l <= 100; l += 2) {
    const test = hslToHex(base.h, base.s, l);
    if (getContrastRatio(test, bg) >= targetRatio) return test;
    best = test;
  }
  return best;
}

/**
 * Linearly interpolates between two hex colours.
 *
 * Converts both colours to RGB, interpolates each channel independently in the
 * 0-255 range, and returns the result as a 6-digit hex string prefixed with `#`.
 * The interpolation factor `t` is clamped to [0, 1] so that values outside the
 * range return the nearest endpoint.
 *
 * @param color1 - The starting hex colour (e.g. `#000000`). Leading `#` is optional.
 * @param color2 - The ending hex colour (e.g. `#ffffff`). Leading `#` is optional.
 * @param t - Interpolation position. `0` returns `color1`, `1` returns `color2`.
 *   Values below `0` are clamped to `0`; values above `1` are clamped to `1`.
 * @returns A 6-digit lowercase hex colour string (e.g. `#808080` for a midpoint lerp).
 *
 * @example
 * ```ts
 * lerpColor('#000000', '#ffffff', 0.5) // '#808080'
 * lerpColor('#ff0000', '#0000ff', 0.5) // '#7f007f'
 * lerpColor('#ff0000', '#0000ff', 0)   // '#ff0000'
 * lerpColor('#ff0000', '#0000ff', 1)   // '#0000ff'
 * ```
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return color1;

  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * clamped);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * clamped);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * clamped);

  return rgbToHex(r, g, b);
}

/**
 * Interpolates through an array of colours at a normalised position.
 *
 * Splits the range [0, 1] into `(colors.length - 1)` equal segments and picks
 * the correct segment based on `t`. Then calls `lerpColor` between the two
 * adjacent colours in that segment.
 *
 * @param colors - An array of two or more hex colour strings.
 * @param t - A number in [0, 1]. `0` returns the first colour; `1` returns the last.
 * @returns A 6-digit hex colour string interpolated from the array.
 *
 * @example
 * ```ts
 * lerpColors(['#ff0000', '#00ff00', '#0000ff'], 0)   // '#ff0000'
 * lerpColors(['#ff0000', '#00ff00', '#0000ff'], 0.5)  // '#7f7f00' (halfway through green)
 * lerpColors(['#ff0000', '#00ff00', '#0000ff'], 1)   // '#0000ff'
 * ```
 */
export function lerpColors(colors: string[], t: number): string {
  if (colors.length === 0) return '#000000';
  if (colors.length === 1) return colors[0];

  const clamped = Math.max(0, Math.min(1, t));
  const segments = colors.length - 1;
  const scaled = clamped * segments;
  const index = Math.floor(scaled);
  const localT = scaled - index;

  const from = colors[Math.min(index, colors.length - 1)];
  const to = colors[Math.min(index + 1, colors.length - 1)];

  return lerpColor(from, to, localT);
}
