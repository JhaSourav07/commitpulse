// app/api/streak/route.ts

import { NextResponse } from 'next/server';
import { fetchGitHubContributions, getOrgDashboardData } from '@/lib/github';
import { calculateStreak, calculateMonthlyStats } from '@/lib/calculate';
import {
  generateNotFoundSVG,
  generateRateLimitSVG,
  generateSVG,
  generateMonthlySVG,
  generateVersusSVG,
  generateHeatmapSVG,
  generatePulseSVG,
} from '@/lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type { BadgeParams } from '@/types';
import { themes } from '@/lib/svg/themes';
import { streakParamsSchema } from '@/lib/validations';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

function escapeSVGText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getMonthlyReferenceDate(year: string | undefined, timezone: string): Date | undefined {
  if (!year) return undefined;

  const selectedYear = Number(year);
  const currentYear = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric' }).format(new Date())
  );

  return selectedYear < currentYear ? new Date(`${year}-12-15T12:00:00Z`) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = streakParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));
  try {
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten();

      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: fieldErrors,
        },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
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
      shading,
      gradient,
      tz: tzParam,
      disable_particles,
      glow,
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

    let timezone = 'UTC';
    if (tzParam) {
      timezone = new Intl.DateTimeFormat(undefined, { timeZone: tzParam }).resolvedOptions()
        .timeZone;
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
    const borderParam = searchParams.get('border');
    const sanitizedBorder = borderParam ? borderParam.replace(/[^a-fA-F0-9]/g, '') : undefined;
    const animate = searchParams.get('animate') !== 'false';
    const params: BadgeParams = {
      user: targetEntity,
      bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
      text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
      accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,
      border: sanitizedBorder,
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
      shading,
      gradient,
      disable_particles,
      glow,
      animate,
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
      const userData = await fetchGitHubContributions(user, {
        bypassCache: refresh,
        from,
        to,
      });
      calendar = userData.calendar;

      if (versus) {
        const versusData = await fetchGitHubContributions(versus, {
          bypassCache: refresh,
          from,
          to,
        });
        versusCalendar = versusData.calendar;
      }
    }

    let svg = '';
    if (view === 'monthly') {
      const stats = calculateMonthlyStats(
        calendar,
        timezone,
        getMonthlyReferenceDate(year, timezone)
      );
      svg = generateMonthlySVG(stats, params);
    } else if (view === 'heatmap') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateHeatmapSVG(stats, params, calendar);
    } else if (view === 'pulse') {
      // We still use calculateStreak here to efficiently parse totalContributions for the stat display,
      // even though the sparkline generator will extract its own daily 30-day timeline below.
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generatePulseSVG(stats, params, calendar);
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
  const message = error instanceof Error ? error.message : String(error);

  const isNotFound =
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('could not resolve');
  const isRateLimit = message.toLowerCase().includes('rate limit');

  // 2. Safely detect if the error was a validation/client error
  const isValidationError =
    (error instanceof Error && error.name === 'ValidationError') ||
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('validation') ||
    message.toLowerCase().includes('strictly for organizations');

  const errBg = `#${(parseResult.success && parseResult.data.bg) || '0d1117'}`;
  const errAccent = `#${
    (parseResult.success &&
      (Array.isArray(parseResult.data.accent)
        ? parseResult.data.accent[parseResult.data.accent.length - 1]
        : parseResult.data.accent)) ||
    '58a6ff'
  }`;
  const errText = `#${(parseResult.success && parseResult.data.text) || 'c9d1d9'}`;
  const errRadius = parseResult.success
    ? (() => {
        const r = Number(parseResult.data.radius);
        return Number.isFinite(r) ? Math.min(32, Math.max(0, r)) : 8;
      })()
    : 8;
  const errSpeed = (parseResult.success && parseResult.data.speed) || '8s';

  if (isRateLimit) {
    const svg = generateRateLimitSVG(errBg, errAccent, errText, errRadius, errSpeed);
    return new NextResponse(svg, {
      status: 429,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Security-Policy': SVG_CSP_HEADER,
      },
    });
  }

  if (isNotFound) {
    const match = message.match(/"([^"]+)"|login of '([^']+)'/);
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

  // 3. Return a 400 Bad Request for Validation Errors
  if (isValidationError) {
    const validationSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffcccc" font-family="sans-serif">
          ${escapeSVGText(message)}
        </text>
      </svg>
    `;

    return new NextResponse(validationSvg, {
      status: 400,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': SVG_CSP_HEADER,
      },
    });
  }

  // 4. Return a 500 Internal Server Error for real crashes
  console.error('[streak] Unhandled error:', message);

  const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffcccc" font-family="sans-serif">
          Something went wrong. Please try again later.
        </text>
      </svg>
    `;

  return new NextResponse(errorSvg, {
    status: 500,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': SVG_CSP_HEADER,
    },
  });
}
