// app/api/tech-stack/route.ts
// REST endpoint: GET /api/tech-stack?user=<username>[&year=<year>]
// Returns JSON analytics of a user's tech stack derived from their GitHub contributions.
// Caches results in MongoDB with a 24-hour TTL to minimize repeated API calls.

import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchGitHubContributions } from '@/lib/github';
import { aggregateTechStack } from '@/lib/svg/techStackAnalytics';
import { GITHUB_USERNAME_REGEX } from '@/lib/validations';
import logger from '@/lib/logger';

// ── Optional MongoDB caching ───────────────────────────────────────────────────
// If MongoDB is not configured, the endpoint gracefully skips caching.

async function tryGetCached(username: string, year: string) {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const TechStackAnalytics = (await import('@/models/TechStackAnalytics')).default;
    await dbConnect();
    const doc = await TechStackAnalytics.findOne({ username: username.toLowerCase(), year }).lean();
    return doc ?? null;
  } catch {
    return null;
  }
}

async function trySetCached(
  username: string,
  year: string,
  data: {
    techStack: Array<{ language: string; commits: number; percentage: number; color: string }>;
    allLanguages: Array<{ language: string; commits: number; percentage: number; color: string }>;
    dominantLanguage: string | null;
    archetype: string;
    totalCommits: number;
  }
) {
  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    const { default: TechStackAnalytics, buildTtlExpiry } =
      await import('@/models/TechStackAnalytics');
    await dbConnect();
    await TechStackAnalytics.findOneAndUpdate(
      { username: username.toLowerCase(), year },
      {
        ...data,
        username: username.toLowerCase(),
        year,
        computedAt: new Date(),
        ttlExpiry: buildTtlExpiry(),
      },
      { upsert: true, new: true }
    );
  } catch {
    // Non-fatal — caching is best-effort
  }
}

// ── Request schema ────────────────────────────────────────────────────────────

const requestSchema = z.object({
  user: z
    .string({ error: 'Missing user parameter' })
    .trim()
    .min(1, { message: 'Missing user parameter' })
    .max(39)
    .regex(GITHUB_USERNAME_REGEX, { message: 'Invalid GitHub username' }),

  year: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const y = parseInt(val, 10);
        return !isNaN(y) && y >= 2008 && y <= new Date().getUTCFullYear();
      },
      { message: 'year must be a valid 4-digit year (2008–present)' }
    )
    .default('all'),
});

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = requestSchema.safeParse({
    user: searchParams.get('user') ?? undefined,
    year: searchParams.get('year') ?? undefined,
  });

  if (!parseResult.success) {
    const errors = parseResult.error.flatten();
    const firstError =
      Object.values(errors.fieldErrors).flat()[0] ?? errors.formErrors[0] ?? 'Invalid parameters';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { user, year } = parseResult.data;

  try {
    // ── Try MongoDB cache ──────────────────────────────────────────────────
    const cached = await tryGetCached(user, year);
    if (cached) {
      return NextResponse.json(
        {
          username: user,
          year,
          techStack: cached.techStack,
          allLanguages: cached.allLanguages,
          dominantLanguage: cached.dominantLanguage,
          archetype: cached.archetype,
          totalCommits: cached.totalCommits,
          cachedAt: (cached as { computedAt?: Date }).computedAt?.toISOString() ?? null,
          source: 'cache',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            'X-Cache-Status': 'HIT',
          },
        }
      );
    }

    // ── Fetch live from GitHub ─────────────────────────────────────────────
    const fromTo =
      year !== 'all' ? { from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` } : {};

    const data = await fetchGitHubContributions(user, fromTo);
    const summary = aggregateTechStack(data.repoContributions ?? []);

    const payload = {
      techStack: summary.topLanguages,
      allLanguages: summary.allLanguages,
      dominantLanguage: summary.dominantLanguage,
      archetype: summary.archetype,
      totalCommits: summary.totalCommits,
    };

    // ── Persist to MongoDB cache (non-blocking) ────────────────────────────
    void trySetCached(user, year, payload);

    return NextResponse.json(
      {
        username: user,
        year,
        ...payload,
        cachedAt: null,
        source: 'live',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'X-Cache-Status': 'MISS',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error('tech-stack API error', { user, year, error: message });

    const isNotFound =
      message.toLowerCase().includes('not found') ||
      message.toLowerCase().includes('"' + user + '" not found');

    return NextResponse.json(
      { error: isNotFound ? `GitHub user "${user}" not found` : 'Failed to fetch tech stack data' },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
