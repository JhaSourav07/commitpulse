import { NextRequest } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak, calculateMonthlyStats } from '../../../lib/calculate';
import { generateSVG, generateMonthlySVG, escapeXML } from '../../../lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';
import type { BadgeParams, ContributionCalendar, StreakStats, MonthlyStats } from '../../../types';
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
} from '@/lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type { BadgeParams } from '@/types';
import { themes } from '@/lib/svg/themes';
import { streakParamsSchema } from '@/lib/validations';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

// 1. Define a custom Error class for Validation
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

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

function validationError(field: string, message: string) {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: { fieldErrors: { [field]: [message] } },
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

function tzError(tz: string) {
  return new Response(`Invalid "tz" parameter: ${tz}`, { status: 400 });
}

function isValidTimezone(tz: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const user = searchParams.get('user');
  const tz = searchParams.get('tz') || undefined;
  const year = searchParams.get('year') || undefined;
  const refresh = searchParams.get('refresh') || undefined;
  const view = searchParams.get('view') || undefined;

  if (!user) {
    return validationError('user', 'Missing "user" parameter');
  }

  if (tz && !isValidTimezone(tz)) {
    return tzError(tz);
  }

  if (year) {
    if (!/^[0-9]{4}$/.test(year)) {
      return validationError('year', 'Year must be a 4-digit year. GitHub was founded in 2008');
    }
    const yearNum = Number(year);
    const nowYear = new Date().getFullYear();
    if (yearNum < 2008 || yearNum > nowYear) {
      return validationError('year', 'GitHub was founded in 2008');
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
        // We throw our new ValidationError here instead of returning directly
        throw new ValidationError(`Invalid "tz" parameter: "${tzParam}"`);
      }
    }
  }

  const bypassCache = refresh === 'true';
  const headers: Record<string, string> = {
    'Content-Type': 'image/svg+xml',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  };

  try {
    const calendar = (await fetchGitHubContributions(user, {
      bypassCache,
      from: year ? `${year}-01-01` : undefined,
      to: year ? `${year}-12-31` : undefined,
    })) as ContributionCalendar;

    const stats = calculateStreak(calendar, tz || 'UTC') as StreakStats;
    // Build a typed params object for the SVG generator. Preserve raw
    // color strings (bg, text, accent) so tests that assert exact colors
    // continue to pass. Convert or filter optional params to reasonable
    // types to satisfy BadgeParams at call sites.
    const raw: Record<string, string> = Object.fromEntries(searchParams.entries());

    // sanitize speed: accept only integer seconds like "3s" in range [2,20]
    let speed: string | undefined = undefined;
    if (raw.speed) {
      const m = raw.speed.match(/^([0-9]+)s$/);
      if (m) {
        const v = Number(m[1]);
        if (v >= 2 && v <= 20) speed = `${v}s`;
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
    }

    const badgeParams: any = {
      user,
      
      bg: raw.bg,
      text: raw.text,
      accent: raw.accent,
      speed: speed,
      scale: raw.scale === 'log' ? 'log' : 'linear',
      font: raw.font ?? undefined,
      radius: raw.radius ? Number(raw.radius) : undefined,
      autoTheme: raw.autoTheme === 'true' || raw.autoTheme === '1' ? true : undefined,
      hide_title: raw.hide_title === 'true' || raw.hide_title === '1' ? true : undefined,
      hideBackground:
        raw.hide_background === 'true' || raw.hide_background === '1' ? true : undefined,
      hide_stats: raw.hide_stats === 'true' || raw.hide_stats === '1' ? true : undefined,
      lang: raw.lang ?? undefined,
      view: raw.view === 'monthly' ? 'monthly' : undefined,
      delta_format: raw.delta_format ?? undefined,
      size: raw.size ?? undefined,
      width: raw.width ? Number(raw.width) : undefined,
      height: raw.height ? Number(raw.height) : undefined,

    };

    // remove keys with undefined values so downstream code can rely on presence
    const finalParams = Object.fromEntries(
      Object.entries(badgeParams).filter(([, v]) => v !== undefined)
    ) as unknown as BadgeParams;
    // If 'org' is provided, we use it as the display user
    const targetEntity = org || user;
    const borderParam = searchParams.get('border');
    const sanitizedBorder = borderParam ? borderParam.replace(/[^a-fA-F0-9]/g, '') : undefined;

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

    let svg: string;
    if (view === 'monthly') {
      const monthly = calculateMonthlyStats(calendar, tz || 'UTC') as MonthlyStats;
      svg = generateMonthlySVG(monthly, finalParams);
    } else {
      svg = generateSVG(stats, finalParams, calendar);
    }

    if (bypassCache) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      const ttl = tz ? getSecondsUntilMidnightInTimezone(tz) : getSecondsUntilUTCMidnight();
      headers['Cache-Control'] = `public, s-maxage=${ttl}, stale-while-revalidate=86400`;
    }

    return new Response(svg, { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const safeMessage = escapeXML(message);
    const body = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" role="img"><title>Error</title><text>${safeMessage}</text></svg>`;
    headers['Cache-Control'] = 'public, s-maxage=60';
    return new Response(body, { status: 500, headers });
      const stats = calculateMonthlyStats(
        calendar,
        timezone,
        getMonthlyReferenceDate(year, timezone)
      );
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
