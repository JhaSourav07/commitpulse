// app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '@/lib/github';
import { calculateStreak } from '@/lib/calculate';
import { statsParamsSchema } from '@/lib/validations';

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

  const { user, refresh, tz } = parseResult.data;

  // Validate the optional IANA timezone early so callers get a clear 400
  // rather than a silent fallback or a 500.
  let timezone = 'UTC';
  if (tz) {
    try {
      timezone = new Intl.DateTimeFormat(undefined, { timeZone: tz }).resolvedOptions().timeZone;
    } catch {
      return NextResponse.json({ error: `Invalid "tz" parameter: "${tz}"` }, { status: 400 });
    }
  }

  try {
    const userData = await fetchGitHubContributions(user, { bypassCache: refresh });
    const calendar = userData.calendar;
    const stats = calculateStreak(calendar, timezone);
    const headers = new Headers({
      // Cache until next UTC midnight; clients can bust with ?refresh=true
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    });

    if (refresh) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    }

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
        { error: 'GitHub API rate limit reached. Please configure GITHUB_TOKEN.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
