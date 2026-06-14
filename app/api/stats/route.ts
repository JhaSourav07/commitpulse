// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { statsParamsSchema } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

function logSecurityEvent(event: string, details: Record<string, unknown>) {
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'SECURITY_EVENT',
      event,
      ...details,
    })
  );
}

/**
 * GET /api/stats?user=<username>[&refresh=true][&tz=<IANA timezone>]
 *
 * Returns JSON contribution stats for a GitHub user. Used by the OG image
 * endpoint (/api/og) and any other consumer that needs numeric stats rather
 * than the SVG badge returned by /api/streak.
 *
 * Response shape:
 * {
 *   "totalContributions": number,
 *   "longestStreak":       number,
 *   "currentStreak":       number
 * }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = getClientIp(request);

  const parseResult = statsParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parseResult.success) {
    const details = parseResult.error.flatten();

    if (details.fieldErrors.tz?.length) {
      return NextResponse.json(
        {
          error: 'Invalid "tz" parameter',
          details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Invalid parameters',
        details,
      },
      { status: 400 }
    );
  }

  const { user, refresh, bypassCache: bypassCacheParam, tz } = parseResult.data;
  // Treat either ?refresh=true or ?bypassCache=true as a cache-bypass request
  const isRefreshRequested = refresh || bypassCacheParam;

  let timezone: string;
  try {
    timezone = tz
      ? new Intl.DateTimeFormat(undefined, { timeZone: tz }).resolvedOptions().timeZone
      : 'UTC';
  } catch {
    return NextResponse.json({ error: `Invalid "tz" parameter: "${tz}"` }, { status: 400 });
  }

  if (isRefreshRequested && quotaMonitor.isQuotaLow()) {
    logSecurityEvent('LOW_QUOTA_STATS_REFRESH_BLOCKED', {
      user,
      ip,
      remainingQuota: quotaMonitor.getQuota().remaining,
    });
    return NextResponse.json(
      { error: 'GitHub API quota is low. Stats refresh temporarily disabled.' },
      { status: 429 }
    );
  }

  if (isRefreshRequested) {
    const rateLimitCheck = refreshRateLimiter.checkLimit(ip);
    if (!rateLimitCheck.success) {
      logSecurityEvent('STATS_REFRESH_RATE_LIMIT_EXCEEDED', {
        user,
        ip,
        limit: rateLimitCheck.limit,
      });
      return NextResponse.json(
        { error: 'Refresh rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': rateLimitCheck.reset.toString(),
          },
        }
      );
    }
  }

  let shouldBypassCache = isRefreshRequested;
  if (isRefreshRequested) {
    if (!refreshPolicy.isRefreshAllowed(user)) {
      logSecurityEvent('STATS_REFRESH_COOLDOWN_VIOLATION', {
        user,
        ip,
        remainingMs: refreshPolicy.getRemainingCooldown(user),
      });
      shouldBypassCache = false;
    }
  }

  try {
    const userData = await fetchGitHubContributions(user, { bypassCache: shouldBypassCache });

    if (shouldBypassCache) {
      refreshPolicy.recordRefresh(user);
    }

    const calendar = userData.calendar;
    const stats = calculateStreak(calendar, timezone);
    const headers = new Headers({
      // Cache until next UTC midnight; clients can bust with ?refresh=true
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    });

    if (shouldBypassCache) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }
    headers.set('X-Cache-Status', shouldBypassCache ? 'MISS' : 'HIT');
    headers.set(
      'X-Refresh-Status',
      shouldBypassCache ? 'Fresh' : isRefreshRequested ? 'Cooldown-Served-Cached' : 'Cached'
    );

    return NextResponse.json(
      {
        totalContributions: stats.totalContributions,
        longestStreak: stats.longestStreak,
        currentStreak: stats.currentStreak,
      },
      { headers }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (
      message.toLowerCase().includes('not found') ||
      message.toLowerCase().includes('could not resolve')
    ) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (
      message.toLowerCase().includes('rate limit') ||
      message.includes('API limit reached') ||
      message.includes('status 403')
    ) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
