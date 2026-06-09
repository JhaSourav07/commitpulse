import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '@/lib/github';
import { statsParamsSchema } from '@/lib/validations';

/**
 * GET /api/activity/heatmap?user=<username>&start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns per‑day contribution counts suitable for rendering a GitHub‑style heatmap.
 * The response shape:
 * {
 *   activity: Array<{ date: string; count: number }>;
 *   totalPRs: number;
 *   totalIssues: number;
 * }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = statsParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { user, start, end } = parseResult.data;

  // The lib expects ISO strings for from/to – we forward them directly.
  const contributions = await fetchGitHubContributions(user, { from: start, to: end });
  const calendar = contributions.calendar;

  // Flatten the weeks structure into a simple date → count list.
  const activity: Array<{ date: string; count: number }> = [];
  if (calendar && Array.isArray(calendar.weeks)) {
    for (const week of calendar.weeks) {
      if (Array.isArray(week.contributionDays)) {
        for (const day of week.contributionDays) {
          activity.push({ date: day.date, count: day.contributionCount });
        }
      }
    }
  }

  const responseBody = {
    activity,
    totalPRs: contributions.totalPRs ?? 0,
    totalIssues: contributions.totalIssues ?? 0,
  };

  // Cache for an hour – client can bust with ?refresh=true if needed.
  const headers = new Headers({
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  });

  return NextResponse.json(responseBody, { headers });
}
