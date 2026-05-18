// app/api/streak/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';
import { generateSVG } from '../../../lib/svg/generator';
import { getSecondsUntilUTCMidnight } from '../../../utils/time';
import type { BadgeParams } from '../../../types';
import { themes } from '../../../lib/svg/themes';
import { streakParamsSchema } from '../../../lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate all incoming params through Zod schema
    const parseResult = streakParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { user, theme, bg, text, accent, scale, speed, radius, font, year, refresh } =
      parseResult.data;

    const hide_stats_param = searchParams.get('hide_stats');
    const hide_stats = hide_stats_param === 'true' || hide_stats_param === '1';

    const themeName = searchParams.get('theme') || 'dark';
    const from = year ? `${year}-01-01T00:00:00Z` : undefined;
    const to = year ? `${year}-12-31T23:59:59Z` : undefined;

    const themeName = theme;
    const isAutoTheme = themeName === 'auto';
    const isRandomTheme = themeName === 'random';
    const selectedTheme = (() => {
      if (isAutoTheme) return themes.light;
      if (isRandomTheme) {
        const themeKeys = Object.keys(themes);
        const randomKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
        return themes[randomKey] || themes.dark;
      }
      return themes[themeName] || themes.dark;
    })();

    // Auto-theme ignores custom hex overrides — the SVG uses CSS
    // custom properties with a prefers-color-scheme media query, so
    // fixed colors would conflict with the dual-palette switching.
    const params: BadgeParams = {
      user,
      bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
      text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
      accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,
      radius,
      speed,
      scale,
      font,
      autoTheme: isAutoTheme,
      hide_stats: hide_stats,
    };

    const calendar = await fetchGitHubContributions(user, { bypassCache: refresh, from, to });
    const stats = calculateStreak(calendar);

    const svg = generateSVG(stats, params, calendar);

    //4. Calculate Cache Control (Reset at UTC Midnight)
    const secondsToMidnight = getSecondsUntilUTCMidnight();
    const cacheControl =
      refresh || isRandomTheme
        ? 'no-cache, no-store, must-revalidate'
        : `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;

    //5. Return the Image Response
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;",
      },
    });
  } catch (error: unknown) {
    console.error('Streak API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffcccc" font-family="sans-serif" font-size="14">
          Error: ${message}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
