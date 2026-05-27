/**
 * Utility for sanitizing and validating SVG customization parameters.
 * Prevents attribute injection and malformed SVG generation.
 */

const HEX_COLOR_REGEX = /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

/**
 * Validates if a string is a valid hex color (without the leading #).
 * Supports 3, 4, 6, and 8 digit hex codes.
 */
export function isValidHex(color?: string): boolean {
  if (!color) return false;
  const cleanColor = color.replace('#', '');
  return HEX_COLOR_REGEX.test(cleanColor);
}

/**
 * Sanitizes a color input, ensuring it's a valid hex or falls back to a safe value.
 * Always returns a hex string WITHOUT the leading #.
 */
export function sanitizeHexColor(input: string | undefined | null, fallback: string): string {
  if (!input) return fallback.replace('#', '');

  const cleanInput = input.trim().replace('#', '');

  if (HEX_COLOR_REGEX.test(cleanInput)) {
    return cleanInput;
  }

  return fallback.replace('#', '');
}

/**
 * Sanitizes the animation speed parameter.
 * Expected format: [number]s (e.g., "8s", "1.5s").
 * Valid range: 2s to 20s.
 */
export function sanitizeSpeed(speed: string | undefined | null, fallback = '8s'): string {
  if (!speed) return fallback;
  const trimmed = speed.trim();
  const match = trimmed.match(/^(\d+(\.\d+)?)s$/);
  if (match) {
    const numeric = parseFloat(match[1]);
    if (numeric >= 2 && numeric <= 20) {
      return trimmed;
    }
  }
  return fallback;
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
  const cleaned = trimmed.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();
  return cleaned || null;
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
  return encodeURIComponent(cleaned).replace(/%20/g, '+');
}
