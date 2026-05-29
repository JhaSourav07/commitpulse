// app/api/streak/route.ts

import { NextResponse } from 'next/server';
import { fetchGitHubContributions, getOrgDashboardData } from '@/lib/github';
import { calculateStreak, calculateMonthlyStats } from '@/lib/calculate';
import {
  generateNotFoundSVG,
  generateSVG,
  generateMonthlySVG,
  generateVersusSVG,
} from '@/lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type { BadgeParams } from '@/types';
import { themes } from '@/lib/svg/themes';
import { streakParamsSchema } from '@/lib/validations';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

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
      from: customFrom,
      to: customTo,
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
      mode,
      repo,
      org,
      labels,
      labelColor,
      versus,
    } = parseResult.data;

    const themeName = theme || 'dark';
    const from = customFrom
      ? new Date(customFrom).toISOString()
      : year
        ? `${year}-01-01T00:00:00Z`
        : undefined;
    const to = customTo
      ? new Date(customTo).toISOString()
      : year
        ? `${year}-12-31T23:59:59Z`
        : undefined;

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
        const hash = user.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const stableKey = keys[hash % keys.length];
        return themes[stableKey] || themes.dark;
      }
      return themes[theme] || themes.dark;
    })();

    // If 'org' is provided, we use it as the display user
    const targetEntity = org || user;

    const params: BadgeParams = {
      user: targetEntity,
      bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
      text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
      accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,
      radius,
      speed: speed && /^(?:[2-9]|1\d|20)s$/.test(speed) ? speed : '8s',
      scale,
      font,
      autoTheme: isAutoTheme,
      hide_title,
      hideBackground: hide_background,
      hide_stats,
      lang,
      view,
      delta_format,
      width,
      height,
      size,
      grace,
      mode,
      repo,
      org,
      labels,
      labelColor,
      versus,
    };

    let calendar;
    let versusCalendar;

    // Fetch Organization Mega-City Data OR Single User Data
    if (org) {
      const orgData = await getOrgDashboardData(org, {
        bypassCache: refresh,
        from,
        to,
      });
      calendar = orgData.calendar;
    } else {
      calendar = await fetchGitHubContributions(user, {
        bypassCache: refresh,
        from,
        to,
      });

      if (versus) {
        versusCalendar = await fetchGitHubContributions(versus, {
          bypassCache: refresh,
          from,
          to,
        });
      }
    }

    let svg = '';
    if (view === 'monthly') {
      const stats = calculateMonthlyStats(calendar, timezone);
      svg = generateMonthlySVG(stats, params);
    } else if (versus && versusCalendar) {
      const stats1 = calculateStreak(calendar, timezone, undefined, grace);
      const stats2 = calculateStreak(versusCalendar, timezone, undefined, grace);
      svg = generateVersusSVG(stats1, stats2, params, calendar, versusCalendar);
    } else {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateSVG(stats, params, calendar);
    }

    const secondsToMidnight = tzParam
      ? getSecondsUntilMidnightInTimezone(timezone)
      : getSecondsUntilUTCMidnight();
    const cacheControl = refresh
      ? 'no-cache, no-store, must-revalidate'
      : `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,
        'Content-Security-Policy': SVG_CSP_HEADER,
        'X-Cache-Status': refresh ? `BYPASS, fetched=${new Date().toISOString()}` : 'HIT',
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
    // If the org parameter was used and failed, fallback to that, otherwise user
    const fallbackTarget = parseResult.success
      ? parseResult.data.org || parseResult.data.user
      : 'unknown';
    const badUsername = match?.[1] ?? match?.[2] ?? fallbackTarget;

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

  console.error('[streak] Unhandled error:', message);

  const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffcccc">
          Something went wrong. Please try again later.
        </text>
      </svg>
    `;

  return new NextResponse(errorSvg, {
    status: 500,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store',
    },
  });
}
