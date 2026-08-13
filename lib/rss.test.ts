import { describe, it, expect, vi } from 'vitest';
import { fetchLatestArticles } from './rss';

// Mock rss-parser so it doesn't make real network requests during tests
vi.mock('rss-parser', () => {
  return {
    default: class MockParser {
      parseURL = vi.fn().mockResolvedValue({
        items: [
          {
            title: 'Test Post',
            link: 'https://dev.to/test',
            pubDate: '2026-06-15T00:00:00Z',
          },
        ],
      });
    },
  };
});

describe('rss / fetchLatestArticles', () => {
  it('[Bug fix] formats pubDate deterministically regardless of Node process locale', async () => {
    // Because rss-parser is mocked above, this will reliably return the mock item
    const articles = await fetchLatestArticles('devto', 'testuser');

    expect(articles).toHaveLength(1);
    // This verifies the 'en-US' Date locale change correctly generates "Jun 15, 2026"
    expect(articles[0].pubDate).toBe('Jun 15, 2026');
  });
});
