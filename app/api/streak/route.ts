// app/api/streak/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';
import { generateNotFoundSVG, generateSVG, escapeXML } from '../../../lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';
import type { BadgeParams } from '../../../types';
import { themes } from '../../../lib/svg/themes';
import { streakParamsSchema } from '../../../lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse and validate all incoming params through Zod schema
  const parseResult = streakParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));
  try {
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      user,
      theme,
      bg,
      text,
      accent,
      scale,
      size,
      speed,
      radius,
      font,
      year,
      refresh,
      hide_title,
      hide_background,
      hide_stats: hideStatsParam,
      lang,
    } = parseResult.data;

    //sanitizing font
    const sanitizedFont = ((): string | undefined => {
      if (!font) return undefined;
      const trimmed = font.trim();
      if (!trimmed) return undefined;
      const cleaned = trimmed.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();
      return cleaned || undefined;
    })();

    const hide_stats = hideStatsParam === 'true' || hideStatsParam === '1';

    const themeName = theme || 'dark';
    const from = year ? `${year}-01-01T00:00:00Z` : undefined;
    const to = year ? `${year}-12-31T23:59:59Z` : undefined;

    // Validate the IANA timezone name early so callers get a clear 400 rather than a
    // silent fallback or a 500. Intl.DateTimeFormat throws a RangeError on unknown zones.
    const tzParam = searchParams.get('tz');
    let timezone = 'UTC';
    if (tzParam) {
      try {
        timezone = new Intl.DateTimeFormat(undefined, { timeZone: tzParam }).resolvedOptions()
          .timeZone;
      } catch {
        return new NextResponse(`Invalid "tz" parameter: "${tzParam}"`, { status: 400 });
      }
    }
    const isAutoTheme = themeName === 'auto';
    const isRandomTheme = themeName === 'random';
    const selectedTheme = (() => {
      if (isAutoTheme) return themes.light;

      if (isRandomTheme) {
        const keys = Object.keys(themes);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return themes[randomKey] || themes.dark;
      }

      return themes[theme] || themes.dark;
    })();

    // â ï¸ Safety layer for rendering only (not parsing logic)
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
      font: sanitizedFont,
      autoTheme: isAutoTheme,
      hide_title,
      hideBackground: hide_background,
      hide_stats: hide_stats,
      lang,
      size,
    };

    const calendar = await fetchGitHubContributions(user, {
      bypassCache: refresh,
      from,
      to,
    });
    const stats = calculateStreak(calendar, timezone);
    const svg = generateSVG(stats, params, calendar);

    // 4. Calculate Cache Control  reset at local midnight when ?tz= is supplied,
    //    otherwise fall back to UTC midnight (original behaviour).
    //    Random themes are never cached because their output changes on every request.
    const secondsToMidnight = tzParam
      ? getSecondsUntilMidnightInTimezone(timezone)
      : getSecondsUntilUTCMidnight();
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
    const isNotFound =
      message.toLowerCase().includes('not found') ||
      message.toLowerCase().includes('could not resolve');

    const errBg = `#${(parseResult.success && parseResult.data.bg) || '0d1117'}`;
    const errAccent = `#${(parseResult.success && parseResult.data.accent) || '58a6ff'}`;
    const errText = `#${(parseResult.success && parseResult.data.text) || 'c9d1d9'}`;
    const errRadius = parseResult.success
      ? (() => {
          const r = Number(parseResult.data.radius);
          return Number.isFinite(r) ? Math.min(32, Math.max(0, r)) : 8;
        })()
      : 8;
    const errSpeed = (parseResult.success && parseResult.data.speed) || '8s';

    if (isNotFound) {
      const match = message.match(/"([^"]+)"|login of '([^']+)'/);
      const badUsername =
        match?.[1] ?? match?.[2] ?? (parseResult.success ? parseResult.data.user : 'unknown');

      const svg = generateNotFoundSVG(badUsername, errBg, errAccent, errText, errRadius, errSpeed);
      return new NextResponse(svg, {
        status: 404,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;",
        },
      });
    }
    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffcccc">
          Error: ${escapeXML(message)}
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
