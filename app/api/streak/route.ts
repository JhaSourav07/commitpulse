// app/api/streak/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak, calculateMonthlyStats } from '../../../lib/calculate';
import {
  generateNotFoundSVG,
  generateSVG,
  generateMonthlySVG,
  escapeXML,
} from '../../../lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';
import type { BadgeParams } from '../../../types';
import { themes } from '../../../lib/svg/themes';
import { streakParamsSchema } from '../../../lib/validations';
const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

/**
 * GET /api/streak - Returns GitHub contribution streak as SVG image
 *
 * Query Parameters:
 * - username (string, required): GitHub username
 * - theme (string, optional): 'default', 'dark', 'light' (default: 'default')
 * - hide_border (boolean, optional): Hide card border (default: false)
 * - hide_title (boolean, optional): Hide card title (default: false)
 * - hide_total (boolean, optional): Hide total contributions (default: false)
 * - count_private (boolean, optional): Include private contributions (default: false)
 * - show_icons (boolean, optional): Show contribution icons (default: true)
 * - ring_color (string, optional): Ring color hex (default: '#2c3e50')
 * - curr_streak_color (string, optional): Current streak text color (default: '#2c3e50')
 * - side_streak_color (string, optional): Longest streak text color (default: '#7f8c8d')
 * - curr_streak_label (string, optional): Current streak label (default: 'Current streak')
 * - side_streak_label (string, optional): Longest streak label (default: 'Longest streak')
 * - date_format (string, optional): Date format (default: 'YYYY-MM-DD')
 *
 * Response:
 * - 200: SVG image with Content-Type: image/svg+xml
 * - Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=60
 * - CSP: default-src 'none'; style-src 'unsafe-inline'
 * - 400: { "error": "Missing required parameter: username" }
 * - 404: { "error": "User not found or has no contributions" }
 * - 500: { "error": "Failed to fetch streak data" }
 *
 * Caching:
 * - Success: Cached 1 hour, stale-while-revalidate 60 seconds
 * - Errors: Not cached
 * - Cache key includes username and theme
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

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
      hide_stats,
      lang,
      view,
      delta_format,
      width,
      height,
      grace,
    } = parseResult.data;

    const themeName = theme || 'dark';
    const from = year ? `${year}-01-01T00:00:00Z` : undefined;
    const to = year ? `${year}-12-31T23:59:59Z` : undefined;

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
      hide_title,
      hideBackground: hide_background,
      hide_stats,
      lang,
      view,
      delta_format,
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      size,
      grace,
    };

    const calendar = await fetchGitHubContributions(user, {
      bypassCache: refresh,
      from,
      to,
    });

    let svg = '';
    if (view === 'monthly') {
      const stats = calculateMonthlyStats(calendar, timezone);
      svg = generateMonthlySVG(stats, params);
    } else {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateSVG(stats, params, calendar);
    }

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
        'Content-Security-Policy': SVG_CSP_HEADER,
      },
    });
  } catch (error: unknown) {
    return buildErrorResponse(error, parseResult);
  }
}

type ParseResult = ReturnType<typeof streakParamsSchema.safeParse>;

function buildErrorResponse(error: unknown, parseResult: ParseResult): NextResponse {
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
        'Content-Security-Policy': SVG_CSP_HEADER,
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
      'Cache-Control': 'public, s-maxage=60',
    },
  });
}
