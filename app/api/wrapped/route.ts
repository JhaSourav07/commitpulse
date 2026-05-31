// app/api/wrapped/route.ts

import { NextResponse } from 'next/server';
import { getWrappedData, fetchGitHubContributions } from '@/lib/github';
import { generateWrappedSVG, generateNotFoundSVG, generateRateLimitSVG } from '@/lib/svg/generator';
import { wrappedParamsSchema } from '@/lib/validations';
import type { BadgeParams } from '@/types';
import { themes } from '@/lib/svg/themes';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

function escapeSVGText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = wrappedParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));
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
      speed,
      radius,
      font,
      year: customYear,
      refresh,
      hide_title,
      hide_background,
      width,
      height,
    } = parseResult.data;

    const year = customYear || new Date().getFullYear().toString();

    const themeName = theme || 'dark';
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

    const borderParam = searchParams.get('border');
    const sanitizedBorder = borderParam ? borderParam.replace(/[^a-fA-F0-9]/g, '') : undefined;

    const params: BadgeParams = {
      user,
      bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
      text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
      accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,
      border: sanitizedBorder,
      radius,
      speed: speed && /^(?:[2-9]|1\d|20)s$/.test(speed) ? speed : '8s',
      font,
      autoTheme: isAutoTheme,
      hide_title,
      hideBackground: hide_background,
      width,
      height,
      scale: 'linear',
    };

    // Fetch the wrapped stats for the year
    const wrappedStats = await getWrappedData(user, year, { bypassCache: refresh });

    // Fetch calendar contributions for rendering the background mini-monolith
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;
    const { calendar } = await fetchGitHubContributions(user, { from, to, bypassCache: refresh });

    const svg = generateWrappedSVG(wrappedStats, params, year, calendar);

    // Cache-Control: Annual wrapped stats are stable, cache for 24 hours.
    // Clients can bust with ?refresh=true.
    const cacheControl = refresh
      ? 'no-cache, no-store, must-revalidate'
      : 'public, s-maxage=86400, stale-while-revalidate=86400';

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

type ParseResult = ReturnType<typeof wrappedParamsSchema.safeParse>;

function buildErrorResponse(error: unknown, parseResult: ParseResult): NextResponse {
  const message = error instanceof Error ? error.message : String(error);

  const isNotFound =
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('could not resolve');
  const isRateLimit = message.toLowerCase().includes('rate limit');

  const isValidationError =
    (error instanceof Error && error.name === 'ValidationError') ||
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('validation');

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
    const fallbackTarget = parseResult.success ? parseResult.data.user : 'unknown';
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

  console.error('[wrapped] Unhandled error:', message);

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
