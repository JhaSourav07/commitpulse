import { NextRequest } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak, calculateMonthlyStats } from '../../../lib/calculate';
import { generateSVG, generateMonthlySVG, escapeXML } from '../../../lib/svg/generator';
import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';
import type { BadgeParams, ContributionCalendar, StreakStats, MonthlyStats } from '../../../types';

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
    const calendar = (await fetchGitHubContributions(user, {
      bypassCache,
      from: year ? `${year}-01-01` : undefined,
      to: year ? `${year}-12-31` : undefined,
    })) as ContributionCalendar;

    const stats = calculateStreak(calendar, tz || 'UTC') as StreakStats;
    // Build a typed params object for the SVG generator. Preserve raw
    // color strings (bg, text, accent) so tests that assert exact colors
    // continue to pass. Convert or filter optional params to reasonable
    // types to satisfy BadgeParams at call sites.
    const raw: Record<string, string> = Object.fromEntries(searchParams.entries());

    // sanitize speed: accept only integer seconds like "3s" in range [2,20]
    let speed: string | undefined = undefined;
    if (raw.speed) {
      const m = raw.speed.match(/^([0-9]+)s$/);
      if (m) {
        const v = Number(m[1]);
        if (v >= 2 && v <= 20) speed = `${v}s`;
      }
    }

    const badgeParams: any = {
      user,
      
      bg: raw.bg,
      text: raw.text,
      accent: raw.accent,
      speed: speed,
      scale: raw.scale === 'log' ? 'log' : 'linear',
      font: raw.font ?? undefined,
      radius: raw.radius ? Number(raw.radius) : undefined,
      autoTheme: raw.autoTheme === 'true' || raw.autoTheme === '1' ? true : undefined,
      hide_title: raw.hide_title === 'true' || raw.hide_title === '1' ? true : undefined,
      hideBackground:
        raw.hide_background === 'true' || raw.hide_background === '1' ? true : undefined,
      hide_stats: raw.hide_stats === 'true' || raw.hide_stats === '1' ? true : undefined,
      lang: raw.lang ?? undefined,
      view: raw.view === 'monthly' ? 'monthly' : undefined,
      delta_format: raw.delta_format ?? undefined,
      size: raw.size ?? undefined,
      width: raw.width ? Number(raw.width) : undefined,
      height: raw.height ? Number(raw.height) : undefined,

    };

    // remove keys with undefined values so downstream code can rely on presence
    const finalParams = Object.fromEntries(
      Object.entries(badgeParams).filter(([, v]) => v !== undefined)
    ) as unknown as BadgeParams;

    let svg: string;
    if (view === 'monthly') {
      const monthly = calculateMonthlyStats(calendar, tz || 'UTC') as MonthlyStats;
      svg = generateMonthlySVG(monthly, finalParams);
    } else {
      svg = generateSVG(stats, finalParams, calendar);
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
