import { NextResponse } from 'next/server';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { analyzeTeamAttribution, type AttributedCommit } from '@/lib/analytics/authorAttribution';

const MAX_COMMITS = 10_000;

function isAttributedCommit(value: unknown): value is AttributedCommit {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.author === 'string' &&
    typeof c.date === 'string' &&
    !Number.isNaN(Date.parse(c.date)) &&
    (c.additions === undefined || (typeof c.additions === 'number' && c.additions >= 0)) &&
    (c.deletions === undefined || (typeof c.deletions === 'number' && c.deletions >= 0))
  );
}

/**
 * Analyze author attribution for a set of commits.
 *
 * Accepts { commits: [{ author, date, additions?, deletions? }] } and
 * returns per-author metrics plus team level indicators (bus factor,
 * contribution concentration, top contributors).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = await rateLimit(ip, 30, 60000, 'team-attribution');
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let body: { commits?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.commits)) {
    return NextResponse.json({ error: 'commits must be an array' }, { status: 400 });
  }
  if (body.commits.length > MAX_COMMITS) {
    return NextResponse.json(
      { error: `commits exceeds the maximum of ${MAX_COMMITS} entries` },
      { status: 413 }
    );
  }
  if (!body.commits.every(isAttributedCommit)) {
    return NextResponse.json(
      { error: 'each commit needs an author string and a valid ISO date' },
      { status: 422 }
    );
  }

  return NextResponse.json(analyzeTeamAttribution(body.commits), {
    headers: getRateLimitHeaders(limit),
  });
}
