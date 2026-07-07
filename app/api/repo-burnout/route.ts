import { NextResponse } from 'next/server';
import { z } from 'zod';
import { coerceQueryParams } from '@/lib/validations';
import { fetchBurnoutAnalysis } from '@/services/github/burnout-analyzer';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { getClientIp } from '@/utils/getClientIp';
import { getUserGitHubToken } from '@/lib/githubtoken';

import { refreshPolicy } from '@/services/github/refresh-policy';
import { getRateLimitHeaders } from '@/lib/rate-limit';
import { refreshRateLimiter } from '@/services/github/refresh-rate-limiter';

function toRefreshFlag(val?: string): boolean {
  return val === 'true' || val === '1';
}

const repoBurnoutParamsSchema = z.object({
  owner: z
    .string({ error: 'Owner is required' })
    .trim()
    .min(1, { message: 'Owner is required' })
    .max(39, { message: 'Owner name cannot exceed 39 characters' })
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9]))*$/, {
      message: 'Invalid owner name format',
    }),
  repo: z
    .string({ error: 'Repo is required' })
    .trim()
    .min(1, { message: 'Repo is required' })
    .max(100, { message: 'Repo name cannot exceed 100 characters' })
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: 'Invalid repo name format',
    }),
  refresh: z.string().optional().transform(toRefreshFlag),
  bypassCache: z.string().optional().transform(toRefreshFlag),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = getClientIp(request);

  const parseResult = repoBurnoutParamsSchema.safeParse(coerceQueryParams(searchParams));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { owner, repo, refresh, bypassCache: bypassCacheParam } = parseResult.data;

  // Treat either ?refresh=true or ?bypassCache=true as a cache-bypass request
  const isRefreshRequested = refresh || bypassCacheParam;

  // 1. Quota awareness check - block manual refreshes if GitHub API quota is low
  if (isRefreshRequested && quotaMonitor.isQuotaLow()) {
    console.warn(`[Quota Low] Blocked manual refresh from IP ${ip} for ${owner}/${repo}`);
    return NextResponse.json(
      { error: 'GitHub API quota is low. Cache refresh temporarily disabled.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  if (isRefreshRequested) {
    const rateLimitCheck = refreshRateLimiter.checkLimit(ip);
    if (!rateLimitCheck.success) {
      console.warn(
        `[Rate Limit Exceeded] Blocked manual refresh from IP ${ip} for ${owner}/${repo}`
      );
      return NextResponse.json(
        { error: 'Refresh rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitCheck),
        }
      );
    }
  }

  let shouldBypassCache = isRefreshRequested;
  if (isRefreshRequested) {
    const resourceKey = `${owner}/${repo}`;
    if (!refreshPolicy.isRefreshAllowed(resourceKey)) {
      shouldBypassCache = false;
    } else {
      refreshPolicy.recordRefresh(resourceKey);
    }
  }

  try {
    const userToken = await getUserGitHubToken();
    const data = await fetchBurnoutAnalysis(owner, repo, {
      bypassCache: shouldBypassCache,
      token: userToken,
    });

    const cacheControl = shouldBypassCache
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=3600, stale-while-revalidate=86400';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
        'X-Cache-Status': shouldBypassCache ? 'MISS' : 'HIT',
      },
    });
  } catch (error: unknown) {
    console.error(`Error in /api/repo-burnout for ${owner}/${repo}:`, error);

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { error: status === 404 ? 'Repository not found' : 'Internal server error' },
      { status }
    );
  }
}
