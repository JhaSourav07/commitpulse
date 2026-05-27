import type { ExportFormat } from './types';

const BADGE_BASE_URL = 'https://commitpulse.vercel.app/api/streak';

/**
 * Removes the leading # from a hex color string.
 * Used specifically for color picker handling in the customize interface.
 */
export function stripHash(val: string): string {
  return val.replace(/^#/, '');
}

/**
 * Validates if a string is a valid 6-digit hex color for the color picker.
 * Intentionally strict (6-digit only) for color customization.
 * Note: lib/svg/sanitizer.ts has a more flexible version supporting 3,4,6,8 digits for SVG theming.
 */
export function isValidHex(value: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(stripHash(value));
}

export function getBadgeUrl(queryString: string): string {
  return `${BADGE_BASE_URL}?${queryString}`;
}

export function getExportSnippet(format: ExportFormat, queryString: string): string {
  const badgeUrl = getBadgeUrl(queryString);

  if (format === 'html') {
    return `<img src="${badgeUrl}" alt="CommitPulse" />`;
  }

  return `![CommitPulse](${badgeUrl})`;
}

export function getPlaceholderSnippet(format: ExportFormat): string {
  return getExportSnippet(format, 'user=your-github-username');
}
