import { describe, it, expect } from 'vitest';
import {
  buildQueryParams,
  getExportSnippet,
  getPlaceholderSnippet,
  streakErrorMessage,
} from './utils';
import type { CustomizeOptions } from './types';

describe('Export Snippet utilities', () => {
  const EXPECTED_BASE_URL = 'https://commitpulse.vercel.app/api/streak';

  describe('getExportSnippet', () => {
    it('generates markdown snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('markdown', queryString);

      expect(typeof result).toBe('string');
      expect(result.startsWith('![CommitPulse Contribution Graph for testuser]')).toBe(true);
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toBe(
        `![CommitPulse Contribution Graph for testuser](${EXPECTED_BASE_URL}?${queryString})`
      );
    });

    it('generates html snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('html', queryString);

      expect(typeof result).toBe('string');
      expect(result.startsWith('<img src=')).toBe(true);
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toBe(
        `<img src="${EXPECTED_BASE_URL}?${queryString}" alt="CommitPulse Contribution Graph for testuser" />`
      );
    });

    it('generates action snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('action', queryString);

      expect(typeof result).toBe('string');
      expect(result.startsWith('name: CommitPulse Streak Badge')).toBe(true);
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toContain(`curl -o commitpulse.svg "${EXPECTED_BASE_URL}?${queryString}"`);
    });

    it('generates tsx snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('tsx', queryString);

      expect(typeof result).toBe('string');
      expect(result).toContain("'use client';");
      expect(result).toContain('export function CommitPulse(');
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toContain('user=testuser&theme=dark');
    });

    it('handles empty query string', () => {
      const emptyQuery = '';
      const markdownResult = getExportSnippet('markdown', emptyQuery);
      const htmlResult = getExportSnippet('html', emptyQuery);

      expect(markdownResult.startsWith('![CommitPulse Contribution Graph]')).toBe(true);
      expect(markdownResult).toContain(EXPECTED_BASE_URL);

      expect(htmlResult.startsWith('<img src=')).toBe(true);
      expect(htmlResult).toContain(EXPECTED_BASE_URL);
    });

    it('handles undefined query string', () => {
      // @ts-expect-error Testing undefined query string at runtime
      const result = getExportSnippet('markdown', undefined);

      expect(result).toBe(`![CommitPulse](${EXPECTED_BASE_URL}?undefined)`);
    });

    it('handles complex query strings', () => {
      const complexQuery = 'user=complex%20name&ring=ff0000%2C00ff00&fire=true';
      const result = getExportSnippet('markdown', complexQuery);

      expect(result).toContain(complexQuery);
      expect(result).toBe(
        `![CommitPulse Contribution Graph for complex%20name](${EXPECTED_BASE_URL}?${complexQuery})`
      );
    });

    it('throws error for unknown format', () => {
      // @ts-expect-error Testing invalid format at runtime
      expect(() => getExportSnippet('unknown', '')).toThrow('Unsupported export format: unknown');
    });
  });

  describe('getPlaceholderSnippet', () => {
    it('includes placeholder username in markdown', () => {
      const result = getPlaceholderSnippet('markdown');

      expect(result.startsWith('![CommitPulse Contribution Graph for your-github-username]')).toBe(
        true
      );
      expect(result).toContain('your-github-username');
      expect(result).toContain(EXPECTED_BASE_URL);
    });

    it('includes placeholder username in html', () => {
      const result = getPlaceholderSnippet('html');

      expect(result.startsWith('<img src=')).toBe(true);
      expect(result).toContain('your-github-username');
      expect(result).toContain(EXPECTED_BASE_URL);
    });

    it('includes placeholder username in action', () => {
      const result = getPlaceholderSnippet('action');

      expect(result.startsWith('name: CommitPulse Streak Badge')).toBe(true);
      expect(result).toContain('your-github-username');
      expect(result).toContain(EXPECTED_BASE_URL);
    });

    it('includes placeholder username in tsx', () => {
      const result = getPlaceholderSnippet('tsx');

      expect(result).toContain("'use client';");
      expect(result).toContain('your-github-username');
      expect(result).toContain(EXPECTED_BASE_URL);
    });

    it('throws for unsupported placeholder format', () => {
      // @ts-expect-error Testing invalid placeholder format at runtime
      expect(() => getPlaceholderSnippet('unsupported')).toThrow(
        'Unsupported export format: unsupported'
      );
    });
  });

  describe('buildQueryParams', () => {
    const defaultOptions: CustomizeOptions = {
      username: 'testuser',
      theme: 'dark',
      bgHex: '',
      bgType: 'solid',
      bgStart: '',
      bgEnd: '',
      bgAngle: 90,
      accentHex: '',
      textHex: '',
      scale: 'linear',
      speed: '8s',
      font: 'Inter',
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
    };

    it('returns minimal params with default values', () => {
      const result = buildQueryParams(defaultOptions);
      // font=Inter is the default and is omitted (consistent with scale, speed, radius, etc.)
      expect(result).toBe('user=testuser&theme=dark');
    });

    it('applies custom theme values', () => {
      const options = { ...defaultOptions, theme: 'light' };
      const result = buildQueryParams(options);
      expect(result).toBe('user=testuser&theme=light');
    });

    it('applies custom color overrides and omits theme', () => {
      const options = {
        ...defaultOptions,
        theme: 'dark',
        bgHex: '#ffffff',
        accentHex: 'ff0000',
        textHex: '#000000',
      };
      const result = buildQueryParams(options);
      expect(result).toBe('user=testuser&bg=ffffff&accent=ff0000&text=000000');
    });

    it('omits partial or invalid hex colors and falls back to theme', () => {
      // Lengths 1, 2 and 5 are the intermediate states while typing a 6-digit hex.
      for (const partial of ['f', 'ff', 'ffaab']) {
        const options = { ...defaultOptions, theme: 'dark', bgHex: partial };
        const result = buildQueryParams(options);
        expect(result).toBe('user=testuser&theme=dark');
        expect(result).not.toContain('bg=');
      }
    });

    it('emits only the valid hex colors when some inputs are still partial', () => {
      const options = {
        ...defaultOptions,
        theme: 'dark',
        bgHex: 'ffffff',
        accentHex: 'ff',
        textHex: '',
      };
      const result = buildQueryParams(options);
      expect(result).toBe('user=testuser&bg=ffffff');
      expect(result).not.toContain('accent=');
      expect(result).not.toContain('theme=');
    });

    it('forces theme parameter and ignores custom colors for virtual themes (auto/random)', () => {
      const optionsAuto = {
        ...defaultOptions,
        theme: 'auto',
        bgHex: 'ffffff',
      };
      const resultAuto = buildQueryParams(optionsAuto);
      expect(resultAuto).toBe('user=testuser&theme=auto');

      const optionsRandom = {
        ...defaultOptions,
        theme: 'random',
        accentHex: 'ff0000',
      };
      const resultRandom = buildQueryParams(optionsRandom);
      expect(resultRandom).toBe('user=testuser&theme=random');
    });

    it('handles empty username gracefully', () => {
      const options = { ...defaultOptions, username: '   ' };
      const result = buildQueryParams(options);
      expect(result).toBe('theme=dark');
    });

    it('includes all customized options', () => {
      const options = {
        ...defaultOptions,
        scale: 'log' as const,
        speed: '4s',
        font: 'fira' as const,
        year: '2023',
        radius: 12,
        size: 'large' as const,
        hideTitle: true,
        hideBackground: true,
        hideStats: true,
        viewMode: 'monthly' as const,
        deltaFormat: 'absolute' as const,
        badgeWidth: 600,
        badgeHeight: 400,
        grace: 2,
        language: 'es' as const,
        timezone: 'America/New_York' as const,
      };
      const result = buildQueryParams(options);
      expect(result).toBe(
        'user=testuser&theme=dark&scale=log&speed=4s&font=fira&year=2023&radius=12&size=large&hide_title=true&hide_background=true&hide_stats=true&view=monthly&delta_format=absolute&width=600&height=400&grace=2&lang=es&tz=America%2FNew_York'
      );
    });
  });
});

describe('streakErrorMessage', () => {
  it('maps 404 to a user-not-found message', () => {
    expect(streakErrorMessage(404)).toBe('GitHub user not found');
  });

  it('maps 400 to an invalid-options message rather than user-not-found', () => {
    expect(streakErrorMessage(400)).toBe('Invalid customization options');
    expect(streakErrorMessage(400)).not.toContain('not found');
  });

  it('maps 429 to a rate-limit message', () => {
    expect(streakErrorMessage(429)).toBe('Rate limit exceeded. Please try again later.');
  });

  it('falls back to a generic message for other statuses', () => {
    expect(streakErrorMessage(500)).toBe('Failed to load badge');
  });
});
