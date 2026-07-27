import Parser from 'rss-parser';

/**
 * Represents a single article fetched from an RSS feed.
 */
export interface Article {
  /** The title of the article. Falls back to 'Untitled' if missing. */
  title: string;
  /** The canonical URL of the article. Empty string if not available. */
  link: string;
  /** Publication date formatted via `toLocaleDateString`. Empty string if not available. */
  pubDate: string;
}

const parser = new Parser({
  timeout: 5000,
});

/**
 * Fetches the top 3 most recent articles from a dev.to or hashnode RSS feed
 * for a given username.
 *
 * @param platform - Which blogging platform to fetch from: `devto` or `hashnode`.
 * @param username - The author's username on the target platform. For hashnode,
 *   this may also be a custom domain.
 * @returns A promise resolving to an array of up to 3 Article objects.
 *   Returns an empty array on any fetch or parse failure.
 * @throws {never} This function never throws; errors are swallowed and logged.
 *
 * @example
 * ```ts
 * const articles = await fetchLatestArticles('devto', 'johndoe');
 * // [{ title: '...', link: 'https://dev.to/...', pubDate: 'Jan 1, 2025' }, ...]
 * ```
 */
export async function fetchLatestArticles(
  platform: 'devto' | 'hashnode',
  username: string
): Promise<Article[]> {
  let feedUrl = '';
  try {
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
    console.error(
      'Error fetching RSS feed for %s/%s (url=%s):',
      platform,
      username,
      feedUrl,
      error
    );
    // Return empty array on error so we can display a fallback/error state in the SVG
    return [];
  }
}
