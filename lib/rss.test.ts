import { describe, expect, it } from 'vitest';
import { fetchLatestArticles } from './rss';

describe('fetchLatestArticles', () => {
  it('returns empty array for unrecognized platform values', async () => {
    const result = await fetchLatestArticles('unknown' as 'devto' | 'hashnode', 'testuser');
    expect(result).toEqual([]);
  });
});
