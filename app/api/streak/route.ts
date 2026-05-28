import { NextRequest } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak, calculateMonthlyStats } from '../../../lib/calculate';
import { generateSVG, generateMonthlySVG, escapeXML } from '../../../lib/svg/generator';
import {
  getSecondsUntilUTCMidnight,
  getSecondsUntilMidnightInTimezone,
} from '../../../utils/time';

function validationError(field: string, message: string) {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: { fieldErrors: { [field]: [message] } },
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}

function tzError(tz: string) {
  return new Response(`Invalid "tz" parameter: ${tz}`, { status: 400 });
}

function isValidTimezone(tz: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const user = searchParams.get('user');
  const tz = searchParams.get('tz') || undefined;
  const year = searchParams.get('year') || undefined;
  const refresh = searchParams.get('refresh') || undefined;
  const view = searchParams.get('view') || undefined;

  if (!user) {
    return validationError('user', 'Missing "user" parameter');
  }

  if (tz && !isValidTimezone(tz)) {
    return tzError(tz);
  }

  if (year) {
    if (!/^[0-9]{4}$/.test(year)) {
      return validationError('year', 'Year must be a 4-digit year. GitHub was founded in 2008');
    }
    const yearNum = Number(year);
    const nowYear = new Date().getFullYear();
    if (yearNum < 2008 || yearNum > nowYear) {
      return validationError('year', 'GitHub was founded in 2008');
    }
  }

  const bypassCache = refresh === 'true';
  const headers: Record<string, string> = {
    'Content-Type': 'image/svg+xml',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  };

  try {
    const calendar = await fetchGitHubContributions(user, {
      bypassCache,
      from: year ? `${year}-01-01` : undefined,
      to: year ? `${year}-12-31` : undefined,
    });

    const stats = calculateStreak(calendar, tz || 'UTC');
    const params: Record<string, string | undefined> = Object.fromEntries(searchParams.entries());

    if (params.speed) {
      const match = params.speed.match(/^([0-9]+)s$/);
      if (!match) {
        delete params.speed;
      } else {
        const speedValue = Number(match[1]);
        if (speedValue < 2 || speedValue > 20) delete params.speed;
      }
    }

    let svg: string;
    if (view === 'monthly') {
      const monthly = calculateMonthlyStats(calendar, tz || 'UTC');
      svg = generateMonthlySVG(monthly as any, params as any);
    } else {
      svg = generateSVG(stats as any, params as any, calendar as any);
    }

    if (bypassCache) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      const ttl = tz ? getSecondsUntilMidnightInTimezone(tz) : getSecondsUntilUTCMidnight();
      headers['Cache-Control'] = `public, s-maxage=${ttl}, stale-while-revalidate=86400`;
    }

    return new Response(svg, { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const safeMessage = escapeXML(message);
    const body = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" role="img"><title>Error</title><text>${safeMessage}</text></svg>`;
    headers['Cache-Control'] = 'public, s-maxage=60';
    return new Response(body, { status: 500, headers });
  }
}
