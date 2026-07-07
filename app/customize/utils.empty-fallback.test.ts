import { describe, expect, it } from 'vitest';
import {
  stripHash,
  isValidHex,
  getBadgeUrl,
  streakErrorMessage,
  getExportSnippet,
  getPlaceholderSnippet,
  buildQueryParams,
} from './utils';
import type { CustomizeOptions } from './types';

function buildOptions(overrides: Partial<CustomizeOptions> = {}): CustomizeOptions {
  return {
    username: '',
    theme: 'dark',
    bgHex: '',
    accentHex: '',
    textHex: '',
    bgType: 'solid',
    bgStart: '',
    bgEnd: '',
    bgAngle: 90,
    scale: 'linear',
    speed: '8s',
    font: '',
    year: '',
    radius: 8,
    size: 'medium',
    hideTitle: false,
    hideBackground: false,
    hideStats: false,
    viewMode: 'default',
    deltaFormat: 'percent',
    badgeWidth: '',
    badgeHeight: '',
    grace: 1,
    language: 'en',
    timezone: 'UTC',
    ...overrides,
  } as CustomizeOptions;
}

describe('customize utils - Edge Cases & Empty/Missing Inputs Verification', () => {
  it('buildQueryParams falls back to the theme param with no crash when all fields are empty', () => {
    const options = buildOptions();

    expect(() => buildQueryParams(options)).not.toThrow();

    const result = buildQueryParams(options);
    const params = new URLSearchParams(result);

    // No username param should be set for an empty/whitespace username
    expect(params.has('user')).toBe(false);
    // Theme fallback marker must exist since no valid custom colors were supplied
    expect(params.get('theme')).toBe('dark');
  });

  it('handles a whitespace-only username by treating it as absent rather than setting an empty param', () => {
    const options = buildOptions({ username: '   ' });

    const result = buildQueryParams(options);
    const params = new URLSearchParams(result);

    expect(params.has('user')).toBe(false);
  });

  it('isValidHex and stripHash return safe non-throwing defaults for empty string input', () => {
    expect(() => stripHash('')).not.toThrow();
    expect(stripHash('')).toBe('');

    expect(() => isValidHex('')).not.toThrow();
    expect(isValidHex('')).toBe(false);

    // Partial/invalid hex values must not crash the validator
    expect(isValidHex('#')).toBe(false);
    expect(isValidHex('12345')).toBe(false);
  });

  it('getExportSnippet produces a non-empty fallback alt text marker when queryString is undefined or has no username', () => {
    expect(() => getExportSnippet('html', undefined as unknown as string)).not.toThrow();

    const noUserSnippet = getExportSnippet('html', '');
    expect(noUserSnippet).toContain('CommitPulse Contribution Graph');
    expect(noUserSnippet).not.toContain('for undefined');
    expect(noUserSnippet).not.toContain('for null');

    const undefinedQuerySnippet = getExportSnippet('markdown', undefined as unknown as string);
    expect(undefinedQuerySnippet).toContain('CommitPulse');
  });

  it('getPlaceholderSnippet and getBadgeUrl produce well-formed non-empty markers for missing real input', () => {
    expect(() => getPlaceholderSnippet('html')).not.toThrow();
    const placeholder = getPlaceholderSnippet('html');
    expect(placeholder).toContain('your-github-username');
    expect(placeholder.length).toBeGreaterThan(0);

    expect(() => getBadgeUrl('')).not.toThrow();
    const emptyBadgeUrl = getBadgeUrl('');
    expect(emptyBadgeUrl).toBe('https://commitpulse.vercel.app/api/streak?');

    // streakErrorMessage must return a non-empty fallback message for an unrecognized status
    expect(() => streakErrorMessage(0)).not.toThrow();
    expect(streakErrorMessage(0)).toBe('Failed to load badge');
    expect(streakErrorMessage(0).length).toBeGreaterThan(0);
  });
});
