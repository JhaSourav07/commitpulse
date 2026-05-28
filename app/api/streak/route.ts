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
import { calculateQueryComplexity, CONTRIBUTIONS_QUERY } from '../../../lib/graphql/client';
import { globalRateLimiter } from '../../../middleware/rate-limit';

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

    // Rate Limiting & Complexity Setup
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : '127.0.0.1';

    const complexity = calculateQueryComplexity(CONTRIBUTIONS_QUERY, {
      login: user,
      from,
      to,
    });

    const skipRateLimit =
      process.env.NODE_ENV === 'test' && request.headers.get('x-test-rate-limit') !== 'true';

    const rateLimitResult = skipRateLimit
      ? {
          allowed: true,
          limit: 10000,
          remaining: 10000,
          reset: Math.ceil(Date.now() / 1000) + 3600,
          waitTimeMs: 0,
        }
      : await globalRateLimiter.consume(ip, complexity);

    if (!rateLimitResult.allowed) {
      const rateLimitSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="450" height="150" viewBox="0 0 450 150">
          <title>CommitPulse Error: Rate Limit Exceeded</title>
          <rect width="100%" height="100%" fill="#1a1a2e" rx="8" stroke="#ff3366" stroke-width="2"/>
          <text x="50%" y="40%" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="bold" fill="#ff3366" font-size="18">
            429: Rate Limit Exceeded
          </text>
          <text x="50%" y="65%" text-anchor="middle" font-family="'Space Grotesk', sans-serif" fill="#e2e2e2" font-size="13">
            Complexity cost of ${complexity} exceeds remaining capacity.
          </text>
          <text x="50%" y="88%" text-anchor="middle" font-family="'Space Grotesk', sans-serif" fill="#a0a0a0" font-size="11">
            Please try again after a few seconds.
          </text>
        </svg>
      `;
      return new NextResponse(rateLimitSvg, {
        status: 429,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Retry-After': String(Math.max(1, Math.ceil(rateLimitResult.reset - Date.now() / 1000))),
          'X-Query-Complexity': String(complexity),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

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
        'X-Query-Complexity': String(complexity),
        'X-RateLimit-Limit': String(rateLimitResult.limit),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
        'X-RateLimit-Wait-Time': String(rateLimitResult.waitTimeMs),
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

      const errHeaders: Record<string, string> = {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;",
      };

      if (parseResult.success) {
        const xForwardedFor = request.headers.get('x-forwarded-for');
        const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : '127.0.0.1';
        const bucket = globalRateLimiter.getBucketState(ip);
        errHeaders['X-RateLimit-Limit'] = String(bucket.limit);
        errHeaders['X-RateLimit-Remaining'] = String(bucket.remaining);
        errHeaders['X-RateLimit-Reset'] = String(bucket.reset);
      }

      return new NextResponse(svg, {
        status: 404,
        headers: errHeaders,
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

    const errHeaders: Record<string, string> = {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=60',
    };

    if (parseResult.success) {
      const xForwardedFor = request.headers.get('x-forwarded-for');
      const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : '127.0.0.1';
      const bucket = globalRateLimiter.getBucketState(ip);
      errHeaders['X-RateLimit-Limit'] = String(bucket.limit);
      errHeaders['X-RateLimit-Remaining'] = String(bucket.remaining);
      errHeaders['X-RateLimit-Reset'] = String(bucket.reset);
    }

    return new NextResponse(errorSvg, {
      status: 500,
      headers: errHeaders,
    });
  }
}
