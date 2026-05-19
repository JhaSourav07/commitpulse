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

    // ✅ Single source of truth: Zod
    const parseResult = streakParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { user, theme, bg, text, accent, scale, speed, radius, font, year, refresh } =
      parseResult.data;

    const from = year ? `${year}-01-01T00:00:00Z` : undefined;
    const to = year ? `${year}-12-31T23:59:59Z` : undefined;

    // Theme selection
    const isAutoTheme = theme === 'auto';
    const isRandomTheme = theme === 'random';

    const selectedTheme = (() => {
      if (isAutoTheme) return themes.light;

      if (isRandomTheme) {
        const keys = Object.keys(themes);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return themes[randomKey] || themes.dark;
      }

      return themes[theme] || themes.dark;
    })();

    // ⚠️ Safety layer for rendering only (not parsing logic)
    const parsedRadius = Number(radius);
    const safeRadius = Number.isFinite(parsedRadius) ? Math.min(32, Math.max(0, parsedRadius)) : 8;
    const params: BadgeParams = {
      user,

      bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
      text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
      accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,

      radius: safeRadius,
      speed,
      scale,
      font,

      autoTheme: isAutoTheme,
    };

    const calendar = await fetchGitHubContributions(user, {
      bypassCache: refresh,
      from,
      to,
    });

    const stats = calculateStreak(calendar);
    const svg = generateSVG(stats, params, calendar);

    const secondsToMidnight = getSecondsUntilUTCMidnight();

    const cacheControl =
      refresh || isRandomTheme
        ? 'no-cache, no-store, must-revalidate'
        : `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffcccc">
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
