import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchBurnoutAnalysis } from '@/services/github/burnout-analyzer';
import { quotaMonitor } from '@/services/github/quota-monitor';
import { getClientIp } from '@/utils/getClientIp';

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
  refresh: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = getClientIp(request);

  const parseResult = repoBurnoutParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { owner, repo, refresh } = parseResult.data;

  // 1. Quota awareness check - block manual refreshes if GitHub API quota is low
  if (refresh && quotaMonitor.isQuotaLow()) {
    console.warn(`[Quota Low] Blocked manual refresh from IP ${ip} for ${owner}/${repo}`);
    return NextResponse.json(
      { error: 'GitHub API quota is low. Cache refresh temporarily disabled.' },
      { status: 429 }
    );
  }

  try {
    const data = await fetchBurnoutAnalysis(owner, repo, { bypassCache: refresh });

    const cacheControl = refresh
      ? 'no-cache, no-store, must-revalidate'
      : 's-maxage=3600, stale-while-revalidate=86400';

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': cacheControl,
        'X-Cache-Status': refresh ? 'MISS' : 'HIT',
      },
    });
  } catch (error: unknown) {
    console.error(`Error in /api/repo-burnout for ${owner}/${repo}:`, error);

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
