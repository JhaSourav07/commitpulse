// app/api/streak/route.ts

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { fetchGitHubContributions, getOrgDashboardData, getCircuitTelemetry } from '@/lib/github';
import {
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
  chunkDaysIntoWeeks,
  normalizeCalendarToTimezone,
} from '@/lib/calculate';
import {
  generateNotFoundSVG,
  generateRateLimitSVG,
  generateSVG,
  generateMonthlySVG,
  generateVersusSVG,
  generateHeatmapSVG,
  generatePulseSVG,
  generateSkylineSVG,
  generateLanguagesSVG,
  generateActivityGraphSVG,
} from '@/lib/svg/generator';
import { generateConstellationSVG } from '@/lib/svg/constellation';
import { generateRadarSVG } from '@/lib/svg/radar';
import { generateDoughnutSVG } from '@/lib/svg/doughnut';
import { optimizeSVG } from '@/lib/svg/optimizer';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type { BadgeParams, RepoContribution, ExtendedContributionData } from '@/types';
import { getNormalizedThemeKey, themes } from '@/lib/svg/themes';
import { streakParamsSchema, coerceQueryParams } from '@/lib/validations';
import { sanitizeHexColor, sanitizeRadius, escapeXML } from '@/lib/svg/sanitizer';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { logger } from '@/lib/logger';

const VALIDATION_CACHE_MAX = 256;
const validationCache = new Map<string, ReturnType<typeof streakParamsSchema.safeParse>>();

function cachedValidation(
  key: string,
  parseFn: () => ReturnType<typeof streakParamsSchema.safeParse>
) {
  let cached = validationCache.get(key);
  if (cached !== undefined) return cached;
  cached = parseFn();
  if (validationCache.size >= VALIDATION_CACHE_MAX) {
    const firstKey = validationCache.keys().next().value;
    if (firstKey !== undefined) validationCache.delete(firstKey);
  }
  validationCache.set(key, cached);
  return cached;
}

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

function buildInlineErrorSVG(text: string): string {
  const MAX_LINE = 48;
  const truncated = text.length > MAX_LINE * 2 ? text.slice(0, MAX_LINE * 2 - 1) + '…' : text;
  const line1 = escapeXML(truncated.slice(0, MAX_LINE));
  const line2 = truncated.length > MAX_LINE ? escapeXML(truncated.slice(MAX_LINE)) : null;
  const textY = line2 ? '62' : '75';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">
  <rect width="400" height="150" fill="#2d0000" rx="8"/>
  <text x="200" y="${textY}" text-anchor="middle" dominant-baseline="central" fill="#ffcccc" font-family="sans-serif" font-size="13">${line1}</text>${
    line2
      ? `\n    <text x="200" y="91" text-anchor="middle" dominant-baseline="central" fill="#ffcccc" font-family="sans-serif" font-size="13">${line2}</text>`
      : ''
  }
  </svg>`;
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

  const cacheKey = searchParams.toString();
  const parseResult = cachedValidation(cacheKey, () =>
    streakParamsSchema.safeParse(coerceQueryParams(searchParams))
  );
  try {
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten();

      const firstError =
        Object.values(fieldErrors.fieldErrors).flat()[0] ??
        fieldErrors.formErrors[0] ??
        'Invalid parameters';
      const errorSvg = buildInlineErrorSVG(firstError);
      return new NextResponse(errorSvg, {
        status: 400,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store',
          'Content-Security-Policy': SVG_CSP_HEADER,
        },
      });
    }

    const {
      user,
      theme,
      bg,
      bgType,
      bgStart,
      bgEnd,
      bgAngle,
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
      bypassCache: bypassCacheParam,
      hide_title,
      custom_title,
      custom_subtitle,
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
      gradient_stops,
      gradient_dir,
      opacity,
      tz: tzParam,
      disable_particles,
      glow,
      format,
      days,
      label,
      badges,
      entrance,
      theta,
      phi,
      border,
      minify,
    } = parseResult.data;
    const normalizedView = view as
      | 'default'
      | 'monthly'
      | 'heatmap'
      | 'pulse'
      | 'skyline'
      | 'languages'
      | 'constellation'
      | 'radar'
      | 'doughnut'
      | 'pie'
      | 'activity_graph';

    const themeKey = getNormalizedThemeKey(theme);
    const themeName = themeKey === 'default' && theme ? theme : themeKey;

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
      let cooldownViolated = false;
      const usernamesToCheck = org
        ? [org]
        : user
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean);
      if (versus) {
        usernamesToCheck.push(versus);
      }

      for (const u of usernamesToCheck) {
        if (!refreshPolicy.isRefreshAllowed(u)) {
          cooldownViolated = true;
          break;
        }
      }

      if (cooldownViolated) {
        shouldBypassCache = false;
      } else {
        for (const u of usernamesToCheck) {
          refreshPolicy.recordRefresh(u);
        }
      }
    }

    let timezone = 'UTC';
    if (tzParam) {
      try {
        timezone = new Intl.DateTimeFormat(undefined, { timeZone: tzParam }).resolvedOptions()
          .timeZone;
      } catch (error) {
        if (error instanceof RangeError) {
          const validationErr = new Error(`Invalid timezone: ${tzParam}`);
          validationErr.name = 'ValidationError';
          throw validationErr;
        }
        throw error;
      }
    }

    const parseDate = (value?: string) => {
      if (!value) {
        return undefined;
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        const validationErr = new Error(`Invalid date: ${value}`);
        validationErr.name = 'ValidationError';
        throw validationErr;
      }

      return date.toISOString();
    };

    let from = parseDate(customFrom) ?? (year ? `${year}-01-01T00:00:00Z` : undefined);

    let to = parseDate(customTo) ?? (year ? `${year}-12-31T23:59:59Z` : undefined);

    if (normalizedView === 'monthly') {
      const referenceDate = getMonthlyReferenceDate(year, timezone) || new Date();
      const localTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(
        referenceDate
      );
      const [currentYearStr, currentMonthStr] = localTodayStr.split('-');
      const currentYearNum = parseInt(currentYearStr, 10);
      const currentMonthNum = parseInt(currentMonthStr, 10);

      let prevMonth = currentMonthNum - 1;
      let prevYear = currentYearNum;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const calculatedFromStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-01T00:00:00Z`;
      if (!from || new Date(from) > new Date(calculatedFromStr)) {
        from = calculatedFromStr;
      }

      const referenceISO = referenceDate.toISOString();
      if (!to || new Date(to) < new Date(referenceISO)) {
        to = referenceISO;
      }
    }

    const currentYear = new Date().getUTCFullYear();
    const isHistoricalYear = !!year && Number(year) < currentYear;

    const isAutoTheme = themeName.toLowerCase() === 'auto';
    const isRandomTheme = themeName.toLowerCase() === 'random';
    const selectedTheme = (() => {
      if (isAutoTheme) return themes.light;
      if (isRandomTheme) {
        const keys = Object.keys(themes);
        const hash = user.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const stableKey = keys[hash % keys.length];
        return themes[stableKey] || themes.dark;
      }
      return themes[themeKey] || themes.dark;
    })();

    // If 'org' is provided, we use it as the display user
    const targetEntity =
      org ||
      (user.includes(',')
        ? user
            .split(',')
            .map((u) => u.trim())
            .slice(0, 2)
            .join(' + ')
        : user);
    const animate = searchParams.get('animate') !== 'false';
    const compact = searchParams.get('compact') === 'true';
    // Validate and clamp the speed param to prevent broken SVG animation
    const rawSpeedNum = speed ? parseFloat(String(speed)) : NaN;
    const validatedSpeed = (
      !isNaN(rawSpeedNum) && isFinite(rawSpeedNum) && rawSpeedNum >= 1 && rawSpeedNum <= 60
        ? `${rawSpeedNum}s`
        : '8s'
    ) as `${number}s`;
    const params: BadgeParams = {
      user: targetEntity,
      theme: themeName,
      bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
      bgType,
      bgStart,
      bgEnd,
      bgAngle,
      text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
      accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,
      border,
      radius,
      speed: validatedSpeed,
      scale,
      font,
      autoTheme: isAutoTheme,
      hide_title,
      custom_title,
      custom_subtitle,
      hideBackground: hide_background,
      hide_stats,
      lang,
      view: normalizedView,
      delta_format,
      width,
      height,
      size,

      grace: Math.max(
        0,
        Math.min(7, typeof grace === 'number' ? grace : parseInt(String(grace || 1), 10))
      ),

      mode,
      repo,
      org,
      labels,
      labelColor,
      versus,
      shading,
      gradient,
      gradient_stops,
      gradient_dir,

      opacity: Math.max(
        0.1,
        Math.min(1.0, typeof opacity === 'number' ? opacity : parseFloat(String(opacity || 1.0)))
      ),

      disable_particles,
      glow,
      animate,
      label,
      badges,
      entrance,
      theta,
      phi,
      compact,
    };

    let calendar;
    let versusCalendar;
    let repoContributions: RepoContribution[] = [];

    // Fetch Organization Mega-City Data OR Single User Data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      if (org) {
        const orgData = await getOrgDashboardData(org, {
          bypassCache: shouldBypassCache,
          from,
          to,
          signal: controller.signal,
        });
        calendar = orgData.calendar;
        repoContributions = normalizedView === 'languages' ? orgData.repoContributions || [] : [];
      } else if (user.includes(',')) {
        const users = user
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean);

        if (users.length > 2) {
          throw new Error(
            'ValidationError: The streak comparison generator strictly accepts a maximum of 2 usernames.'
          );
        }
        let lastError: unknown = null;
        let hasOfflineFallback = false;
        const fetchedCalendars = await Promise.all(
          users.map(async (u) => {
            try {
              const userData = await fetchGitHubContributions(u, {
                bypassCache: shouldBypassCache,
                from,
                to,
                signal: controller.signal,
              });
              if (userData.isOfflineFallback) {
                hasOfflineFallback = true;
              }
              return userData;
            } catch (err) {
              lastError = err;
              return null;
            }
          })
        );
        const successfulData = fetchedCalendars.filter(
          (d): d is ExtendedContributionData => d !== null
        );
        if (successfulData.length === 0) {
          throw lastError || new Error('No successful data fetched');
        }
        calendar = aggregateCalendars(successfulData.map((d) => d.calendar));
        repoContributions =
          normalizedView === 'languages'
            ? successfulData.flatMap((d) => d.repoContributions || [])
            : [];
        if (hasOfflineFallback) {
          params.isOfflineFallback = true;
        }
      } else {
        const userData = await fetchGitHubContributions(user, {
          bypassCache: shouldBypassCache,
          from,
          to,
          signal: controller.signal,
        });
        calendar = userData.calendar;
        repoContributions = normalizedView === 'languages' ? userData.repoContributions || [] : [];
        if (userData.isOfflineFallback) {
          params.isOfflineFallback = true;
        }

        if (versus) {
          const versusData = await fetchGitHubContributions(versus, {
            bypassCache: shouldBypassCache,
            from,
            to,
            signal: controller.signal,
          });
          versusCalendar = versusData.calendar;
          if (versusData.isOfflineFallback) {
            params.isOfflineFallback = true;
          }
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (days && normalizedView !== 'monthly') {
      const allDays = calendar.weeks.flatMap((w) => w.contributionDays);

      const filteredDays = allDays.slice(-days);

      calendar = {
        totalContributions: filteredDays.reduce((sum, d) => sum + d.contributionCount, 0),
        weeks: chunkDaysIntoWeeks(filteredDays),
      };
    }

    // ─── JSON output mode ──────────────────────────────────────────────────
    if (format === 'json') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      const monthlyStats = calculateMonthlyStats(
        calendar,
        timezone,
        getMonthlyReferenceDate(year, timezone)
      );

      const secondsToMidnight = tzParam
        ? getSecondsUntilMidnightInTimezone(timezone)
        : getSecondsUntilUTCMidnight();
      const cacheControl = isRefreshRequested
        ? 'no-cache, no-store, must-revalidate'
        : `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;

      const cacheStatusHeader = shouldBypassCache
        ? `BYPASS, fetched=${new Date().toISOString()}`
        : 'HIT';

      const jsonPayload = JSON.stringify({
        user: targetEntity,
        stats,
        monthlyStats,
        calendar: {
          totalContributions: calendar.totalContributions,
          weeks: calendar.weeks,
        },
      });

      const etag = crypto.createHash('sha1').update(jsonPayload).digest('hex');
      const weakEtag = `W/"${etag}"`;
      const ifNoneMatch = request.headers.get('if-none-match');

      if (ifNoneMatch) {
        const etags = ifNoneMatch.split(',').map((e) => e.trim());
        if (etags.includes(weakEtag) || etags.includes(`"${etag}"`)) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              'Cache-Control': cacheControl,
              ETag: weakEtag,
            },
          });
        }
      }

      return new NextResponse(jsonPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': cacheControl,
          ETag: weakEtag,
          'X-Cache-Status': cacheStatusHeader,
        },
      });
    }

    // ─── SVG output mode (default) ──────────────────────────────────────────
    let svg = '';
    if (normalizedView === 'monthly') {
      const stats = calculateMonthlyStats(
        calendar,
        timezone,
        getMonthlyReferenceDate(year, timezone)
      );
      svg = generateMonthlySVG(stats, params);
    } else if (normalizedView === 'languages') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateLanguagesSVG(stats, params, repoContributions);
    } else if (normalizedView === 'heatmap') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateHeatmapSVG(stats, params, calendar);
    } else if (normalizedView === 'pulse') {
      // We still use calculateStreak here to efficiently parse totalContributions for the stat display,
      // even though the sparkline generator will extract its own daily 30-day timeline below.
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generatePulseSVG(stats, params, calendar);
    } else if (normalizedView === 'skyline') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateSkylineSVG(stats, params, calendar);
    } else if (normalizedView === 'constellation') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateConstellationSVG(stats, params, calendar);
    } else if (normalizedView === 'radar') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateRadarSVG(stats, params, calendar);
    } else if (normalizedView === 'doughnut' || normalizedView === 'pie') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateDoughnutSVG(stats, params, calendar);
    } else if (normalizedView === 'activity_graph') {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateActivityGraphSVG(stats, params, calendar);
    } else if (versus && versusCalendar) {
      // Normalize both calendars to the target timezone for accurate comparison
      const normalizedCalendar = normalizeCalendarToTimezone(calendar, timezone);
      const normalizedVersusCalendar = normalizeCalendarToTimezone(versusCalendar, timezone);

      const stats1 = calculateStreak(normalizedCalendar, timezone, undefined, grace);
      const stats2 = calculateStreak(normalizedVersusCalendar, timezone, undefined, grace);
      svg = generateVersusSVG(stats1, stats2, params, normalizedCalendar, normalizedVersusCalendar);
    } else {
      const stats = calculateStreak(calendar, timezone, undefined, grace);
      svg = generateSVG(stats, params, calendar);
    }

    if (minify) {
      svg = optimizeSVG(svg);
    }

    const secondsToMidnight = tzParam
      ? getSecondsUntilMidnightInTimezone(timezone)
      : getSecondsUntilUTCMidnight();
    const cacheControl = isRefreshRequested
      ? 'no-cache, no-store, must-revalidate'
      : isHistoricalYear
        ? 'public, max-age=31536000, s-maxage=31536000, immutable'
        : `public, max-age=60, s-maxage=${secondsToMidnight}, stale-while-revalidate=60`;

    const etag = crypto.createHash('sha256').update(svg).digest('hex');
    const weakEtag = `W/"${etag}"`;
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch) {
      const etags = ifNoneMatch.split(',').map((e) => e.trim());
      if (etags.includes(weakEtag) || etags.includes(`"${etag}"`)) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': cacheControl,
            ETag: weakEtag,
          },
        });
      }
    }

    if (format === 'png') {
      const { Resvg } = await import('@resvg/resvg-js');
      const resvg = new Resvg(svg, {
        background: 'transparent',
        fitTo: { mode: 'original' },
      });
      const pngBuffer = resvg.render().asPng();

      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': cacheControl,
          'X-CommitPulse-Grace-Applied': String(grace),
          ETag: weakEtag,
          'X-Cache-Status': shouldBypassCache
            ? `BYPASS, fetched=${new Date().toISOString()}`
            : 'HIT',
        },
      });
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': cacheControl,
        'Content-Security-Policy': SVG_CSP_HEADER,
        'X-CommitPulse-Grace-Applied': String(grace),
        ETag: weakEtag,
        'X-Cache-Status': shouldBypassCache ? `BYPASS, fetched=${new Date().toISOString()}` : 'HIT',
      },
    });
  } catch (error: unknown) {
    return buildErrorResponse(error, parseResult);
  }
}

type ParseResult = ReturnType<typeof streakParamsSchema.safeParse>;

function sanitizeErrorMessage(message: string): string {
  if (message.includes('ZodError') || message.includes('zod')) {
    return 'Invalid request parameters';
  }
  if (message.includes('schema') || message.includes('Schema')) {
    return 'Invalid request parameters';
  }
  return message;
}

function buildErrorResponse(error: unknown, parseResult: ParseResult): NextResponse {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = sanitizeErrorMessage(rawMessage);

  if (parseResult.success && parseResult.data.format === 'json') {
    const isNotFound =
      message.toLowerCase().includes('not found') ||
      message.toLowerCase().includes('could not resolve');
    const isRateLimit = message.toLowerCase().includes('rate limit');
    const isValidationError =
      (error instanceof Error && error.name === 'ValidationError') ||
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('validation') ||
      message.toLowerCase().includes('strictly for organizations');

    const status = isRateLimit ? 429 : isNotFound ? 404 : isValidationError ? 400 : 500;
    const jsonErrorHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    };
    if (isRateLimit) {
      jsonErrorHeaders['Retry-After'] = '60';
    }
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: jsonErrorHeaders,
      }
    );
  }

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

  const errBg = `#${sanitizeHexColor(parseResult.success ? parseResult.data.bg : undefined, '0d1117')}`;
  const errAccentRaw =
    (parseResult.success &&
      (Array.isArray(parseResult.data.accent)
        ? parseResult.data.accent[parseResult.data.accent.length - 1]
        : parseResult.data.accent)) ||
    undefined;
  const errAccent = `#${sanitizeHexColor(errAccentRaw, '58a6ff')}`;
  const errText = `#${sanitizeHexColor(parseResult.success ? parseResult.data.text : undefined, 'c9d1d9')}`;
  const errRadius = sanitizeRadius(parseResult.success ? parseResult.data.radius : undefined, 8);
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
    const fallbackTarget = parseResult.success
      ? parseResult.data.org || parseResult.data.user
      : 'unknown';
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

  // 3. Return a 400 Bad Request for Validation Errors
  if (isValidationError) {
    const validationSvg = buildInlineErrorSVG(message);

    return new NextResponse(validationSvg, {
      status: 400,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': SVG_CSP_HEADER,
      },
    });
  }

  // 4. Return a 500 Internal Server Error for real crashes
  logger.error('Unhandled error', {
    source: 'streak',
    message,
  });

  const errorSvg = buildInlineErrorSVG('Something went wrong. Please try again later.');

  return new NextResponse(errorSvg, {
    status: 500,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': SVG_CSP_HEADER,
    },
  });
}
