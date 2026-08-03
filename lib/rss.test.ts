import { describe, expect, it, vi } from 'vitest';
import { fetchLatestArticles } from './rss';

vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: vi.fn().mockResolvedValue({
      items: [
        { title: 'Test Article 1', link: 'https://example.com/1', pubDate: '2024-01-01T12:00:00Z' },
        { title: 'Test Article 2', link: 'https://example.com/2', pubDate: '2024-01-02T12:00:00Z' },
        { title: 'Test Article 3', link: 'https://example.com/3', pubDate: '2024-01-03T12:00:00Z' },
      ],
    }),
  })),
}));

describe('fetchLatestArticles', () => {
  it('returns empty array for unrecognized platform values', async () => {
    const result = await fetchLatestArticles('unknown' as 'devto' | 'hashnode', 'testuser');
    expect(result).toEqual([]);
  });

  it('returns empty array when platform is undefined', async () => {
    const result = await fetchLatestArticles(undefined as 'devto' | 'hashnode', 'testuser');
    expect(result).toEqual([]);
  });
});
