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

/**
 * GET handler to generate a GitHub contribution streak or monthly stats SVG.
 *
 * @param {Request} request - The incoming HTTP request containing query parameters.
 * @param {string} [request.url?user] - GitHub username.
 * @param {string} [request.url?theme='dark'] - Visual theme ('light', 'dark', 'auto', 'random').
 * @param {string} [request.url?bg] - Background color (hex).
 * @param {string} [request.url?text] - Text color (hex).
 * @param {string} [request.url?accent] - Accent color (hex).
 * @param {number} [request.url?scale] - Scale of the chart.
 * @param {string} [request.url?size] - Size of the badge.
 * @param {string} [request.url?speed] - Animation speed (e.g., '8s').
 * @param {number} [request.url?radius] - Border radius.
 * @param {string} [request.url?font] - Font family.
 * @param {string} [request.url?year] - Specific year for the visualization.
 * @param {boolean} [request.url?refresh] - If true, bypasses cache to fetch fresh data.
 * @param {boolean} [request.url?hide_title] - Hides the title.
 * @param {boolean} [request.url?hide_background] - Hides the background.
 * @param {boolean} [request.url?hide_stats] - Hides the statistics.
 * @param {string} [request.url?lang] - Language for the visualization.
 * @param {string} [request.url?view] - View mode ('monthly' for monthly stats, otherwise streak).
 * @param {string} [request.url?delta_format] - Format for deltas.
 * @param {number} [request.url?width] - SVG width.
 * @param {number} [request.url?height] - SVG height.
 * @param {string} [request.url?tz] - Timezone (e.g., 'Europe/Madrid').
 *
 * @returns {Promise<NextResponse>} A promise that resolves to a `NextResponse` containing:
 * - 200 OK: An `image/svg+xml` response with the generated chart.
 * - 400 Bad Request: A JSON response with error details if parameters are invalid.
 * - 400 Bad Request: A plain text response if the `tz` parameter is invalid.
 * - 404 Not Found: An `image/svg+xml` response indicating the user was not found.
 * - 500 Internal Server Error: An `image/svg+xml` response with the error message.
 *
 * @example
 * // Generate a dark theme streak for user 'octocat'
 * // GET /api/streak?user=octocat&theme=dark
 *
 * @example
 * // Generate monthly stats for 'octocat' in 2023
 * // GET /api/streak?user=octocat&view=monthly&year=2023
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
      const stats = calculateStreak(calendar, timezone);
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
        'Cache-Control': 'public, s-maxage=60',
      },
    });
  }
}
