/**
 * RSS feed parser for developer blog platforms.
 *
 * Fetches and parses RSS/Atom feeds from dev.to and Hashnode to surface a user's
 * latest articles in CommitPulse's SVG renders. The parser is intentionally
 * lightweight: it extracts only the three most recent articles, formats their
 * publication dates in the local browser locale, and silently returns an empty
 * array on any fetch or parse error.
 *
 * @module
 */

import Parser from 'rss-parser';

/**
 * A normalised article entry parsed from an RSS or Atom feed.
 */
export interface Article {
  /** The article title, falling back to 'Untitled' when the feed omits it. */
  title: string;

  /** The canonical URL of the article. Empty string if the feed omits the link. */
  link: string;

  /**
   * The publication date formatted as a human-readable string in the runtime's
   * locale (e.g. "Jan 15, 2024"). Empty string when the feed omits `pubDate`.
   */
  pubDate: string;
}

const parser = new Parser({
  timeout: 5000,
});

/**
 * Fetches the latest articles from a developer's blog RSS feed.
 *
 * Supports dev.to and Hashnode. For Hashnode, accepts either a bare username
 * (e.g. `yourname`) or a full custom domain (e.g. `blog.yoursite.com`). The
 * function always returns exactly the three most recent articles or an empty
 * array if the fetch fails.
 *
 * @param platform - The target platform: `'devto'` or `'hashnode'`.
 * @param username - For `devto`, the dev.to username. For `hashnode`, either
 *   the bare username (e.g. `yourname`) or a full custom domain (e.g. `blog.example.com`).
 * @returns A Promise resolving to an array of up to three `Article` objects,
 *   sorted by publication date descending (most recent first). Returns `[]` on
 *   any network or parse error.
 *
 * @throws {never} This function never throws. Errors are caught and result in
 *   an empty array being returned so callers can render a fallback UI.
 *
 * @example
 * ```ts
 * const articles = await fetchLatestArticles('devto', 'octocat');
 * console.log(articles[0].title); // Most recent article title
 * ```
 *
 * @example
 * ```ts
 * const articles = await fetchLatestArticles('hashnode', 'myblog.com');
 * console.log(articles.length); // 0-3
 * ```
 */
export async function fetchLatestArticles(
  platform: 'devto' | 'hashnode',
  username: string
): Promise<Article[]> {
  try {
    let feedUrl = '';
    if (platform === 'devto') {
      feedUrl = `https://dev.to/feed/${username}`;
    } else if (platform === 'hashnode') {
      // Support custom domains if the username contains a dot and doesn't look like a standard username
      if (username.includes('.') && !username.endsWith('.hashnode.dev')) {
        // If it's a full URL, use it directly (basic validation)
        feedUrl = username.startsWith('http') ? username : `https://${username}/rss.xml`;
      } else {
        // Strip out .hashnode.dev if the user accidentally included it
        const cleanUsername = username.replace('.hashnode.dev', '');
        feedUrl = `https://${cleanUsername}.hashnode.dev/rss.xml`;
      }
    }

    const feed = await parser.parseURL(feedUrl);

    // Get the top 3 articles
    const articles = feed.items.slice(0, 3).map((item) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate
        ? new Date(item.pubDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '',
    }));

    return articles;
  } catch (error) {
    console.error('Error fetching RSS feed for %s/%s:', platform, username, error);
    // Return empty array on error so we can display a fallback/error state in the SVG
    return [];
  }
}
