// app/api/streak/route.ts

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import {
  fetchGitHubContributions,
  getOrgDashboardData,
  getCircuitTelemetry,
  fetchCommitHourDistribution,
  isAbortError,
} from '@/lib/github';
import {
  calculateStreak,
  calculateMonthlyStats,
  aggregateCalendars,
  convertLocalToUtc,
  chunkDaysIntoWeeks,
  normalizeCalendarToTimezone,
  isLeapYear,
  daysInYear,
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
import { generateCommitClockSVG } from '@/lib/svg/commitClock';
import { generateWeekdaySVG } from '@/lib/svg/weekday';
import { injectStaleWatermark } from '@/lib/svg/staleWatermark';
import { optimizeSVG } from '@/lib/svg/optimizer';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '@/utils/time';
import type {
  BadgeParams,
  RepoContribution,
  ExtendedContributionData,
  ContributionCalendar,
  StreakStats,
} from '@/types';
import { getNormalizedThemeKey, themes } from '@/lib/svg/themes';
import { streakParamsSchema, coerceQueryParams } from '@/lib/validations';
import { sanitizeHexColor, sanitizeRadius, escapeXML } from '@/lib/svg/sanitizer';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { logger, setRequestId, clearRequestId } from '@/lib/logger';

import { validationCache as _vc, normalizeCacheKey, cachedValidation } from './validation-cache';
// Re-alias so existing usages in this file continue to work.
const validationCache = _vc;

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

function buildInlineErrorSVG(text: string): string {
  const MAX_LINE = 48;
  const chars = Array.from(text);
  const truncated =
    chars.length > MAX_LINE * 2 ? chars.slice(0, MAX_LINE * 2 - 1).join('') + '…' : text;
  const truncatedChars = Array.from(truncated);
  const line1 = escapeXML(truncatedChars.slice(0, MAX_LINE).join(''));
  const line2 =
    truncatedChars.length > MAX_LINE ? escapeXML(truncatedChars.slice(MAX_LINE).join('')) : null;
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
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  setRequestId(requestId);

  const { searchParams } = new URL(request.url);

  const cacheKey = normalizeCacheKey(searchParams);
  const parseResult = cachedValidation(cacheKey, () =>
    streakParamsSchema.safeParse(coerceQueryParams(searchParams))
  );
  logger.info('Incoming streak request', {
    source: 'streak',
    user: parseResult.success ? parseResult.data.user : undefined,
    view: parseResult.success ? parseResult.data.view : undefined,
  });
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
          'X-Request-ID': requestId,
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
      start_date,
      end_date,
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
      hide_weekend,
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
      | 'activity_graph'
      | 'commit_clock'
      | 'weekday';
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
      } finally {
        logger.info('Streak request completed', {
          source: 'streak',
        });
        clearRequestId();
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

    const finalFrom = parseDate(start_date) ?? parseDate(customFrom);
    const finalTo = parseDate(end_date) ?? parseDate(customTo);

    let from = finalFrom ?? (year ? `${year}-01-01T00:00:00Z` : undefined);
    let to = finalTo ?? (year ? `${year}-12-31T23:59:59Z` : undefined);

    let autoSubtitle = custom_subtitle;
    if (!autoSubtitle && (start_date || end_date)) {
      const formatOpts: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone,
      };
      const startStr = start_date
        ? new Intl.DateTimeFormat('en-US', formatOpts).format(new Date(start_date))
        : 'Start';
      const endStr = end_date
        ? new Intl.DateTimeFormat('en-US', formatOpts).format(new Date(end_date))
        : 'Present';
      autoSubtitle = `${startStr} - ${endStr}`;
    }

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
      custom_subtitle: autoSubtitle,
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
      hide_weekend,
    };

    let calendar;
    let individualCalendars: { user: string; calendar: ContributionCalendar }[] | undefined;
    let versusCalendar;
    let repoContributions: RepoContribution[] = [];
    let servedFromStaleCache = false;

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
        individualCalendars = orgData.individualCalendars;
        repoContributions = normalizedView === 'languages' ? orgData.repoContributions || [] : [];
      } else if (user.includes(',')) {
        const users = user
          .split(',')
          .map((u) => u.trim())
          .filter(Boolean);

        if (users.length > 7) {
          throw new Error(
            'ValidationError: A maximum of 7 usernames is supported for the skyline.'
          );
        }

        if (
          users.length > 2 &&
          (versus || (normalizedView !== 'skyline' && normalizedView !== 'default'))
        ) {
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
                servedFromStaleCache = true;
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
        individualCalendars = successfulData.map((d, i) => ({
          user: users[i],
          calendar: d.calendar,
        }));
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
          servedFromStaleCache = true;
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
            servedFromStaleCache = true;
          }
        }
      }
    } finally {
      logger.info('Streak request completed', {
        source: 'streak',
        user,
        view: normalizedView,
        format,
        status: 200,
        durationMs: Date.now() - start,
      });
      clearTimeout(timeoutId);
    }
    // Pre-calculate full, unsliced statistics first
    let fullStats: StreakStats;
    let fullVersusStats: StreakStats | undefined;
    let fullWeekdayStats: StreakStats | undefined;

    if (versus && versusCalendar) {
      // Normalize both calendars to the target timezone for accurate comparison
      const normalizedCalendar = normalizeCalendarToTimezone(calendar, timezone);
      const normalizedVersusCalendar = normalizeCalendarToTimezone(versusCalendar, timezone);

      fullStats = calculateStreak(normalizedCalendar, timezone, undefined, grace);
      fullVersusStats = calculateStreak(normalizedVersusCalendar, timezone, undefined, grace);
    } else {
      fullStats = calculateStreak(calendar, timezone, undefined, grace);
      if (normalizedView === 'weekday') {
        const normalizedCalendar = normalizeCalendarToTimezone(calendar, timezone);
        fullWeekdayStats = calculateStreak(normalizedCalendar, timezone, undefined, grace);
      }
    }

    const fullMonthlyStats = calculateMonthlyStats(
      calendar,
      timezone,
      getMonthlyReferenceDate(year, timezone)
    );
    if (normalizedView !== 'monthly') {
      let effectiveDays = days;

      if (!effectiveDays && year) {
        const yearNum = parseInt(year, 10);
        if (!isNaN(yearNum)) {
          effectiveDays = daysInYear(yearNum);
        }
      }

      if (effectiveDays) {
        const allDays = calendar.weeks.flatMap((w) => w.contributionDays);
        const filteredDays = allDays.slice(-effectiveDays);
        calendar = {
          totalContributions: filteredDays.reduce((sum, d) => sum + d.contributionCount, 0),
          weeks: chunkDaysIntoWeeks(filteredDays),
        };

        if (versusCalendar) {
          const versusDays = versusCalendar.weeks.flatMap((w) => w.contributionDays);
          const filteredVersusDays = versusDays.slice(-effectiveDays);
          versusCalendar = {
            totalContributions: filteredVersusDays.reduce((sum, d) => sum + d.contributionCount, 0),
            weeks: chunkDaysIntoWeeks(filteredVersusDays),
          };
        }
      }
    }

    // ─── JSON output mode ──────────────────────────────────────────────────
    if (format === 'json') {
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
        stats: fullStats,
        monthlyStats: fullMonthlyStats,
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
              'X-Request-ID': requestId,
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
          'X-Request-ID': requestId,
        },
      });
    }

    // ─── SVG output mode (default) ──────────────────────────────────────────
    let svg = '';
    if (normalizedView === 'monthly') {
      svg = generateMonthlySVG(fullMonthlyStats, params);
    } else if (normalizedView === 'languages') {
      svg = generateLanguagesSVG(fullStats, params, repoContributions);
    } else if (normalizedView === 'heatmap') {
      svg = generateHeatmapSVG(fullStats, params, calendar);
    } else if (normalizedView === 'pulse') {
      // We still use calculateStreak here to efficiently parse totalContributions for the stat display,
      // even though the sparkline generator will extract its own daily 30-day timeline below.
      svg = generatePulseSVG(fullStats, params, calendar);
    } else if (normalizedView === 'skyline') {
      svg = generateSkylineSVG(fullStats, params, calendar);
    } else if (normalizedView === 'constellation') {
      svg = generateConstellationSVG(fullStats, params, calendar);
    } else if (normalizedView === 'radar') {
      const hourCounts = await fetchCommitHourDistribution(user, undefined, timezone).catch(
        () => undefined
      );
      svg = generateRadarSVG(fullStats, params, calendar, hourCounts);
    } else if (normalizedView === 'doughnut' || normalizedView === 'pie') {
      svg = generateDoughnutSVG(fullStats, params, calendar);
    } else if (normalizedView === 'activity_graph') {
      svg = generateActivityGraphSVG(fullStats, params, calendar);
    } else if (normalizedView === 'commit_clock') {
      const hourCounts = await fetchCommitHourDistribution(user, undefined, timezone).catch(() =>
        new Array(24).fill(0)
      );
      svg = generateCommitClockSVG(hourCounts, fullStats, params);
    } else if (normalizedView === 'weekday') {
      const normalizedCalendar = normalizeCalendarToTimezone(calendar, timezone);
      svg = generateWeekdaySVG(fullWeekdayStats || fullStats, params, normalizedCalendar);
    } else if (versus && versusCalendar) {
      // Normalize both calendars to the target timezone for accurate comparison
      const normalizedCalendar = normalizeCalendarToTimezone(calendar, timezone);
      const normalizedVersusCalendar = normalizeCalendarToTimezone(versusCalendar, timezone);

      svg = generateVersusSVG(
        fullStats,
        fullVersusStats!,
        params,
        normalizedCalendar,
        normalizedVersusCalendar
      );
    } else {
      svg = generateSVG(fullStats, params, calendar, individualCalendars);
    }

    if (servedFromStaleCache) {
      svg = injectStaleWatermark(svg);
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
        : `public, max-age=60, s-maxage=${secondsToMidnight}, stale-while-revalidate=59`;

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
            'X-Request-ID': requestId,
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
            : `HIT, cached=${new Date().toISOString()}`,
          'X-Request-ID': requestId,
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
        'X-Request-ID': requestId,
      },
    });
  } catch (error: unknown) {
    return buildErrorResponse(error, parseResult, requestId);
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
  // Preserve user-facing validation messages — these are intentional,
  // safe error strings thrown by route-level validation and do not
  // expose internal implementation details.
  const lower = message.toLowerCase();
  if (lower.includes('strictly for organizations')) {
    return 'This endpoint is strictly for organizations.';
  }
  if (lower.includes('strictly accepts a maximum of 2')) {
    return 'The streak comparison generator strictly accepts a maximum of 2 usernames.';
  }
  if (lower.includes('maximum of 7 usernames')) {
    return 'A maximum of 7 usernames is supported for the skyline.';
  }
  if (lower.includes('quota is low')) {
    return 'API rate limit quota is low. Please try again later.';
  }
  // Issue #7263: Return a generic message for all other errors to
  // prevent leaking internal implementation details (auth state, cache
  // servers, token rotation info, etc.) to the client.
  return 'Something went wrong. Please try again later.';
}

function buildErrorResponse(
  error: unknown,
  parseResult: ParseResult,
  requestId?: string
): NextResponse {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = sanitizeErrorMessage(rawMessage);

  if (parseResult.success && parseResult.data.format === 'json') {
    const isTimeout = isAbortError(error);
    const isNotFound =
      rawMessage.toLowerCase().includes('not found') ||
      rawMessage.toLowerCase().includes('could not resolve');
    const isRateLimit = rawMessage.toLowerCase().includes('rate limit');
    const isValidationError =
      (error instanceof Error && error.name === 'ValidationError') ||
      rawMessage.toLowerCase().includes('invalid') ||
      rawMessage.toLowerCase().includes('validation') ||
      rawMessage.toLowerCase().includes('strictly for organizations');

    if (isTimeout) {
      return NextResponse.json(
        { error: 'Upstream request timed out after 10 seconds.' },
        {
          status: 504,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }
      );
    }

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
    rawMessage.toLowerCase().includes('not found') ||
    rawMessage.toLowerCase().includes('could not resolve');
  const isRateLimit = rawMessage.toLowerCase().includes('rate limit');

  // 2. Safely detect if the error was a validation/client error
  const isValidationError =
    (error instanceof Error && error.name === 'ValidationError') ||
    rawMessage.toLowerCase().includes('invalid') ||
    rawMessage.toLowerCase().includes('validation') ||
    rawMessage.toLowerCase().includes('strictly for organizations');

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
    if (requestId) {
      headers['X-Request-ID'] = requestId;
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
    const errorHeaders: Record<string, string> = {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Security-Policy': SVG_CSP_HEADER,
    };
    if (requestId) {
      errorHeaders['X-Request-ID'] = requestId;
    }
    return new NextResponse(svg, {
      status: 404,
      headers: errorHeaders,
    });
  }

  // 3. Return a 400 Bad Request for Validation Errors
  if (isValidationError) {
    const validationSvg = buildInlineErrorSVG(message);
    const errorHeaders: Record<string, string> = {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': SVG_CSP_HEADER,
    };
    if (requestId) {
      errorHeaders['X-Request-ID'] = requestId;
    }
    return new NextResponse(validationSvg, {
      status: 400,
      headers: errorHeaders,
    });
  }

  // 4. Return a 504 Gateway Timeout for aborted/timed out requests
  if (isAbortError(error)) {
    const timeoutSvg = buildInlineErrorSVG('Request timed out. Please try again later.');
    const errorHeaders: Record<string, string> = {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': SVG_CSP_HEADER,
    };
    if (requestId) {
      errorHeaders['X-Request-ID'] = requestId;
    }
    return new NextResponse(timeoutSvg, {
      status: 504,
      headers: errorHeaders,
    });
  }

  // 5. Return a 500 Internal Server Error for real crashes
  logger.error('Unhandled error', {
    source: 'streak',
    message,
  });

  const errorSvg = buildInlineErrorSVG('Something went wrong. Please try again later.');
  const errorHeaders: Record<string, string> = {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': SVG_CSP_HEADER,
  };
  if (requestId) {
    errorHeaders['X-Request-ID'] = requestId;
  }
  return new NextResponse(errorSvg, {
    status: 500,
    headers: errorHeaders,
  });
}
