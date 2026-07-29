import Parser from 'rss-parser';

/**
 * Represents a single article fetched from a blog's RSS feed.
 */
export interface Article {
  /** The article title. Falls back to "Untitled" when the feed item has no title. */
  title: string;
  /** The canonical URL of the article. Empty string when not available in the feed. */
  link: string;
  /**
   * A human-readable publication date string (locale-sensitive).
   * Falls back to an empty string when `pubDate` is absent in the feed item.
   */
  pubDate: string;
}

const parser = new Parser({
  timeout: 5000,
});

/**
 * Fetches the most recent articles from a developer's blog via RSS.
 *
 * Supports two platforms:
 * - **dev.to** — constructs the standard `dev.to/feed/{username}` feed URL.
 * - **hashnode** — constructs a `*.hashnode.dev/rss.xml` URL. If `username` already
 *   contains a dot (e.g. a custom domain), it is used as-is as the base URL.
 *
 * On any error (network failure, invalid username, malformed XML) the function
 * returns an empty array. Callers should display a fallback or "no articles" state.
 *
 * @param platform - The blog platform: `'devto'` or `'hashnode'`.
 * @param username - The developer's username or custom domain on the target platform.
 * @returns A promise resolving to an array of up to 3 `Article` objects, newest-first.
 *   Returns an empty array when the feed cannot be fetched or parsed.
 *
 * @example
 * const articles = await fetchLatestArticles('hashnode', 'johndoe');
 * // articles → [{ title: '...', link: '...', pubDate: 'Jan 15, 2024' }, ...]
 *
 * @example
 * const articles = await fetchLatestArticles('hashnode', 'blog.example.com');
 * // Uses `blog.example.com/rss.xml` as the feed URL
 */
export async function fetchLatestArticles(
  platform: 'devto' | 'hashnode',
  username: string
): Promise<Article[]> {
  // Guard against empty or whitespace-only usernames before constructing a URL.
  if (!username || typeof username !== 'string' || username.trim() === '') {
    return [];
  }

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
