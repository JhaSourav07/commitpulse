/**
 * Utility for sanitizing and validating SVG customization parameters.
 * Prevents attribute injection and malformed SVG generation.
 */

import type { HexColor } from '../../types/index';
import type { SpeedString } from '../../types/index';

const HEX_COLOR_REGEX = /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/**
 * Validates if a string is a valid hex color (without the leading #).
 * Supports 3, 4, 6, and 8 digit hex codes.
 */
export function isValidHex(color?: string): boolean {
  if (!color) return false;
  const cleanColor = color.replace(/^#+/, '');
  return HEX_COLOR_REGEX.test(cleanColor);
}

/**
 * Converts a known-safe hex color literal to the `HexColor` branded type.
 * Intended for hardcoded values in theme definitions, tests, and fixtures
 * where the color is authored by a developer rather than supplied by user input.
 *
 * If the value is invalid, falls back to `fallback` (defaults to `'000000'`).
 * For user-supplied input, use `sanitizeHexColor` instead.
 */
export function hexColor(value: string, fallback = '000000'): HexColor {
  const cleaned = value.replace(/^#+/, '');
  if (HEX_COLOR_REGEX.test(cleaned)) {
    return cleaned as HexColor;
  }
  return fallback.replace(/^#+/, '') as HexColor;
}

/**
 * Sanitizes a color input, ensuring it's a valid hex or falls back to a safe value.
 * Always returns a hex string WITHOUT the leading #.
 */
export function sanitizeHexColor(input: string | undefined | null, fallback: string): HexColor {
  if (!input) return fallback.replace(/^#+/, '') as HexColor;

  const cleanInput = input.trim().replace(/^#+/, '');

  if (HEX_COLOR_REGEX.test(cleanInput)) {
    return cleanInput as HexColor;
  }

  return fallback.replace(/^#+/, '') as HexColor;
}

/**
 * Sanitizes the animation speed parameter.
 * Expected format: [number]s (e.g., "8s", "1.5s").
 * Valid range: 2s to 20s.
 */
export function sanitizeSpeed(speed: string | undefined | null, fallback = '8s'): SpeedString {
  if (!speed) return fallback as SpeedString;
  const trimmed = speed.trim();
  const match = trimmed.match(/^(\d+(\.\d+)?)s$/);
  if (match) {
    const numeric = parseFloat(match[1]);
    if (numeric >= 2 && numeric <= 20) {
      return trimmed as SpeedString;
    }
  }
  return fallback as SpeedString;
}

/**
 * Sanitizes the border radius parameter.
 * Ensures it's a valid number between 0 and 50.
 */
export function sanitizeRadius(radius: string | number | undefined | null, fallback = 8): number {
  const parsed = typeof radius === 'number' ? radius : parseInt(String(radius), 10);
  if (isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(parsed, 50));
}

/**
 * Sanitizes font names to prevent CSS/SVG injection.
 * Only allows alphanumeric characters, spaces, hyphens, and single quotes.
 */
export function sanitizeFont(font: string | undefined | null): string | null {
  if (!font) return null;
  const trimmed = font.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
  return cleaned || null;
}

/**
 * Sanitizes a width/height dimension destined for direct interpolation into
 * an SVG attribute (e.g. `width="${w}"`, `viewBox="0 0 ${w} ${h}"`).
 * ...
 */
export function sanitizeDimension(
  value: string | number | undefined | null,
  fallback: number,
  min = 1,
  max = 5000
): number {
  const safeFallback = Math.round(Math.max(min, Math.min(fallback, max)));

  if (value === undefined || value === null) return safeFallback;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return safeFallback;
    return Math.round(Math.max(min, Math.min(value, max)));
  }

  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.round(Math.max(min, Math.min(parsed, max)));
    }
  }

  return safeFallback;
}

/**
 * Validates and sanitizes a Google Font name for safe use in external @import URLs.
 * Returns the URL-safe font name (spaces replaced with '+') or null if invalid/unsafe.
 */
export function sanitizeGoogleFontUrl(fontName: string | undefined | null): string | null {
  if (!fontName) return null;

  const trimmed = fontName.trim();
  if (!trimmed) return null;

  // Whitelist approach: Only allow alphanumeric characters, spaces, and hyphens.
  // This completely eliminates any possibility of URL/CSS injection, path traversal,
  // or breaking out of quotes in external font imports.
  if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
    return null;
  }

  // Also apply standard font name sanitization to ensure consistency
  const cleaned = sanitizeFont(trimmed);
  if (!cleaned) return null;

  // Return the encoded font name suitable for Google Fonts API URL (spaces replaced with '+')
  return cleaned.replace(/\s+/g, '+');
}

export function getLuminance(hex: string): number {
  let normalized = hex.trim().replace(/^#/, '');
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = `${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`;
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(normalized.slice(2, 4), 16) / 255 || 0;
  const b = parseInt(normalized.slice(4, 6), 16) / 255 || 0;

  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Normalizes a single hex color string by removing leading '#' and validating it.
 * Returns the clean hex string (without '#') or null if invalid.
 */
export function normalizeHexColor(color: string): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  const cleaned = trimmed.replace(/^#+/, '');
  if (HEX_COLOR_REGEX.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/**
 * Maximum number of gradient stop colors accepted from a single URL parameter.
 * Guards against O(n) CPU exhaustion from unbounded comma-separated input even
 * if the upstream string-length limit were ever relaxed.
 */
export const MAX_GRADIENT_STOPS = 10;

/**
 * Parses comma-separated hex colors from a gradient_stops URL parameter.
 * Accepts colors with or without leading '#'.
 * Returns an array of normalized hex colors (without '#'), or empty array if no valid colors found.
 * At most MAX_GRADIENT_STOPS entries are processed; any extra tokens are silently ignored.
 */
export function parseGradientStops(input?: string): string[] {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const colors = input
    .split(',')
    .slice(0, MAX_GRADIENT_STOPS)
    .map((color) => normalizeHexColor(color))
    .filter((color) => color !== null)
    .slice(0, 10) as string[];

  return colors;
}

export function getGradientCoordinates(dir?: string): {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
} {
  const direction = (dir || 'vertical').toLowerCase().trim();

  switch (direction) {
    case 'horizontal':
      return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' };
    case 'diagonal':
      return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' };
    case 'vertical':
    default:
      return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' };
  }
}

export function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * Sanitizes input string to prevent XML injection/XSS.
 * Removes/escapes any characters that could break out of SVG tags/attributes.
 */
export function sanitizeCustomText(text: string | undefined | null): string {
  if (!text) return '';
  return escapeXML(text);
}
