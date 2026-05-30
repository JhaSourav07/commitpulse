import { describe, expect, it } from 'vitest';
import { getExportSnippet, getPlaceholderSnippet } from './utils';

describe('Export Snippet utilities', () => {
  const EXPECTED_BASE_URL = 'https://commitpulse.vercel.app/api/streak';

  describe('getExportSnippet', () => {
    it('generates markdown snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('markdown', queryString);

      expect(typeof result).toBe('string');
      expect(result.startsWith('![CommitPulse]')).toBe(true);
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toBe(`![CommitPulse](${EXPECTED_BASE_URL}?${queryString})`);
    });

    it('generates html snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('html', queryString);

      expect(typeof result).toBe('string');
      expect(result.startsWith('<img src=')).toBe(true);
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toBe(`<img src="${EXPECTED_BASE_URL}?${queryString}" alt="CommitPulse" />`);
    });

    it('generates action snippet', () => {
      const queryString = 'user=testuser&theme=dark';
      const result = getExportSnippet('action', queryString);

      expect(typeof result).toBe('string');
      expect(result.startsWith('name: CommitPulse Streak Badge')).toBe(true);
      expect(result).toContain(EXPECTED_BASE_URL);
      expect(result).toContain(`curl -o commitpulse.svg "${EXPECTED_BASE_URL}?${queryString}"`);
    });

    it('handles empty query string', () => {
      const emptyQuery = '';
      const markdownResult = getExportSnippet('markdown', emptyQuery);
      const htmlResult = getExportSnippet('html', emptyQuery);

      expect(markdownResult.startsWith('![CommitPulse]')).toBe(true);
      expect(markdownResult).toContain(EXPECTED_BASE_URL);

      expect(htmlResult.startsWith('<img src=')).toBe(true);
      expect(htmlResult).toContain(EXPECTED_BASE_URL);
    });

    it('handles complex query strings', () => {
      const complexQuery = 'user=complex%20name&ring=ff0000%2C00ff00&fire=true';
      const result = getExportSnippet('markdown', complexQuery);

      expect(result).toContain(complexQuery);
      expect(result).toBe(`![CommitPulse](${EXPECTED_BASE_URL}?${complexQuery})`);
    });

    it('throws error for unknown format', () => {
      // @ts-expect-error Testing invalid format at runtime
      expect(() => getExportSnippet('unknown', '')).toThrow('Unsupported export format: unknown');
    });
  });

  describe('getPlaceholderSnippet', () => {
    it('includes placeholder username in markdown', () => {
      const result = getPlaceholderSnippet('markdown');

      expect(result.startsWith('![CommitPulse]')).toBe(true);
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
  });
});
