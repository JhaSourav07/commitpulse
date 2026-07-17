// app/api/wrapped/route.ts

import { NextResponse } from 'next/server';
import { getWrappedData, getCircuitTelemetry } from '@/lib/github';
import { generateWrappedSVG, generateNotFoundSVG, generateRateLimitSVG } from '@/lib/svg/generator';
import { escapeXML } from '@/lib/svg/sanitizer';
import { wrappedParamsSchema, coerceQueryParams } from '@/lib/validations';
import type { BadgeParams } from '@/types';
import { themes } from '@/lib/svg/themes';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import logger from '@/lib/logger';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

// Removing escapeSVGText in favor of escapeXML

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = wrappedParamsSchema.safeParse(coerceQueryParams(searchParams));
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
      bypassCache: bypassCacheParam,
      hide_title,
      hide_background,
      width,
      height,
      org,
      tz,
    } = parseResult.data;

    const year =
      customYear ||
      (tz
        ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(new Date())
        : new Date().getFullYear().toString());

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
      speed,
      font,
      autoTheme: isAutoTheme,
      hide_title,
      hideBackground: hide_background,
      width,
      height,
      scale: 'linear',
    };

    const ip = getClientIp(request);

    // Treat either ?refresh=true or ?bypassCache=true as a cache-bypass request
    const isRefreshRequested = refresh || bypassCacheParam;

    if (isRefreshRequested && quotaMonitor.isQuotaLow()) {
      throw new Error('Rate Limit: GitHub API quota is low. Cache refresh temporarily disabled.');
    }

    if (isRefreshRequested) {
      const rateLimitCheck = refreshRateLimiter.checkLimit(ip);
      if (!rateLimitCheck.success) {
        throw new Error('Rate Limit: Refresh rate limit exceeded. Please try again later.');
      }
    }

    let shouldBypassCache = isRefreshRequested;
    if (isRefreshRequested) {
      if (!refreshPolicy.isRefreshAllowed(user)) {
        shouldBypassCache = false;
      } else {
        console.log('recordRefresh executed');
        refreshPolicy.recordRefresh(user);
      }
    }

    // Fetch the wrapped stats for the year (calendar is included to avoid a duplicate API call)
    const wrappedStats = tz
      ? await getWrappedData(user, year, { bypassCache: shouldBypassCache, org }, tz)
      : await getWrappedData(user, year, { bypassCache: shouldBypassCache, org });

    const svg = generateWrappedSVG(wrappedStats, params, year, wrappedStats.calendar);

    // Cache-Control: Annual wrapped stats are stable, cache for 24 hours.
    // Clients can bust with ?refresh=true or ?bypassCache=true.
    const cacheControl = isRefreshRequested
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=14400, s-maxage=86400, stale-while-revalidate=7200';

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': cacheControl,
        'Content-Security-Policy': SVG_CSP_HEADER,
        'X-Cache-Status': shouldBypassCache ? `BYPASS, fetched=${new Date().toISOString()}` : 'HIT',
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
    const telemetry = getCircuitTelemetry();
    const isCircuitOpen = telemetry.isOpen;
    const svg = generateRateLimitSVG(errBg, errAccent, errText, errRadius, errSpeed, isCircuitOpen);

    const headers: Record<string, string> = {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Security-Policy': SVG_CSP_HEADER,
    };

    headers['Retry-After'] = '60';
    if (isCircuitOpen) {
      headers['X-CommitPulse-Circuit-Status'] = 'Open';
      headers['X-CommitPulse-Circuit-Reset-In'] = String(telemetry.resetInMs);
    }

    return new NextResponse(svg, {
      status: 429,
      headers,
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
        'Content-Type': 'image/svg+xml; charset=utf-8',
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
          ${escapeXML(message)}
        </text>
      </svg>
    `;

    return new NextResponse(validationSvg, {
      status: 400,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': SVG_CSP_HEADER,
      },
    });
  }

  logger.error('Unhandled error', {
    source: 'wrapped',
    message,
  });

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
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': SVG_CSP_HEADER,
    },
  });
}
