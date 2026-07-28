import Parser from 'rss-parser';

export interface Article {
  title: string;
  link: string;
  pubDate: string;
}

const parser = new Parser({
  timeout: 5000,
});

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
