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
