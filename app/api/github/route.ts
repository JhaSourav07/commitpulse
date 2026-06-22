// app/api/github/route.ts

import { NextResponse, after } from 'next/server';
import { getFullDashboardData } from '@/lib/github';
import { githubParamsSchema } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { refreshPolicy } from '@/services/github/refresh-policy';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';
import { backgroundRefresh } from '@/services/github/background-refresh';

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
 * Returns GitHub dashboard data as JSON.
 *
 * Query params:
 * - username: GitHub username to fetch dashboard statistics for
 * - refresh: Optional boolean to bypass cache and fetch fresh data
 *
 * Success (200):
 * - Returns dashboard profile, repositories, activity and contribution data
 *
 * Error codes:
 * - 400 → Invalid query parameters
 * - 403 → GitHub API rate limit reached
 * - 404 → GitHub user not found
 * - 429 → Too many requests
 * - 500 → Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = getClientIp(request);

  const parseResult = githubParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { username, refresh, bypassCache: bypassCacheParam } = parseResult.data;

  const isRefreshRequested = refresh || bypassCacheParam;

  if (isRefreshRequested && quotaMonitor.isQuotaLow()) {
    logSecurityEvent('LOW_QUOTA_REFRESH_BLOCKED', {
      username,
      ip,
      remainingQuota: quotaMonitor.getQuota().remaining,
    });

    return NextResponse.json(
      {
        error: 'GitHub API quota is low. Cache refresh temporarily disabled.',
      },
      { status: 429 }
    );
  }

  if (isRefreshRequested) {
    const rateLimitCheck = refreshRateLimiter.checkLimit(ip);

    if (!rateLimitCheck.success) {
      logSecurityEvent('REFRESH_RATE_LIMIT_EXCEEDED', {
        username,
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
    if (!refreshPolicy.isRefreshAllowed(username)) {
      logSecurityEvent('REFRESH_COOLDOWN_VIOLATION', {
        username,
        ip,
        remainingMs: refreshPolicy.getRemainingCooldown(username),
      });

      shouldBypassCache = false;
    } else {
      refreshPolicy.recordRefresh(username);
    }
  }

  try {
    const data = await getFullDashboardData(username, {
      bypassCache: shouldBypassCache,
    });

    if (!shouldBypassCache) {
      const lastSynced = data.lastSyncedAt;

      if (backgroundRefresh.isStale(lastSynced)) {
        after(() => backgroundRefresh.triggerRefresh(username));
      }
    }

    const cacheControl = shouldBypassCache
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=3600, stale-while-revalidate=86400';

    const cacheStatus = shouldBypassCache ? 'MISS' : 'HIT';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
        'X-Cache-Status': cacheStatus,
        'X-Refresh-Status': shouldBypassCache
          ? 'Fresh'
          : isRefreshRequested
            ? 'Cooldown-Served-Cached'
            : 'Cached',
      },
    });
  } catch (error: unknown) {
    let currentErr: unknown = error;

    while (currentErr && typeof currentErr === 'object' && 'cause' in currentErr) {
      currentErr = (currentErr as { cause: unknown }).cause;
    }

    const err = (currentErr || error) as {
      status?: number;
      response?: { status?: number };
      message?: string;
    };

    const status = err.status || err.response?.status;
    const message = err.message || '';

    if (status === 404 || message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (status === 401) {
      return NextResponse.json(
        { error: 'GitHub authentication failed. Please try again later.' },
        { status: 401 }
      );
    }

    if (status === 403) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    if (status === 429) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );
    }

    if (!status && message === 'API Rate Limit Exceeded') {
      return NextResponse.json(
        {
          error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.',
        },
        { status: 403 }
      );
    }

    // Default fallback
    const errMessage = error instanceof Error ? error.message : 'Internal Server Error';

    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
