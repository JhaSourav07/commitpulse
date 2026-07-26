import { NextResponse } from 'next/server';
import { fetchLatestArticles } from '@/lib/rss';
import { generateArticlesSVG } from '@/lib/svg/articles';
import { getNormalizedThemeKey, themes } from '@/lib/svg/themes';
import { sanitizeHexColor } from '@/lib/svg/sanitizer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');
    const platformParam = searchParams.get('platform');

    if (!user) {
      return new NextResponse('Missing user parameter', { status: 400 });
    }

    const platform = platformParam === 'hashnode' ? 'hashnode' : 'devto';

    // Fetch RSS articles
    const articles = await fetchLatestArticles(platform, user);

    // Apply theme
    const themeKey = getNormalizedThemeKey(searchParams.get('theme') || 'default');
    const theme = themes[themeKey] || themes.default;

    // Allow custom colors
    const bg = searchParams.get('bg')
      ? sanitizeHexColor(searchParams.get('bg')!, theme.bg)
      : theme.bg;
    const text = searchParams.get('text')
      ? sanitizeHexColor(searchParams.get('text')!, theme.text)
      : theme.text;
    let accent = theme.accent;
    const accentParam = searchParams.get('accent');
    if (accentParam) {
      // support comma separated list, just take the first
      const accents = accentParam.split(',').map((c) => sanitizeHexColor(c.trim(), theme.accent));
      if (accents.length > 0 && accents[0]) {
        accent = accents[0];
      }
    }

    const radius = searchParams.get('radius') || '4';
    const size = searchParams.get('size') || '1';

    const params = {
      user,
      platform,
      bg,
      text,
      accent,
      radius,
      size,
    };

    const svg = generateArticlesSVG(articles, params);

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating articles SVG:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
