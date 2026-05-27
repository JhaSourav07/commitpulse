import { NextResponse } from 'next/server';

import { fetchGitHubContributions } from '../../../lib/github';

import { calculateStreak, calculateMonthlyStats } from '../../../lib/calculate';

import {
  generateNotFoundSVG,
  generateSVG,
  generateMonthlySVG,
  escapeXML,
} from '../../../lib/svg/generator';

import { getSecondsUntilUTCMidnight, getSecondsUntilMidnightInTimezone } from '../../../utils/time';

import type { BadgeParams } from '../../../types';

import { themes } from '../../../lib/svg/themes';

import { streakParamsSchema } from '../../../lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawParams = Object.fromEntries(searchParams.entries());

    const parseResult = streakParamsSchema.safeParse(rawParams);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      user,
      theme,
      bg,
      text,
      accent,
      scale,
      size,
      speed,
      radius,
      font,
      year,
      refresh,
      hide_title,
      hide_background,
      hide_stats,
      lang,
      view,
      delta_format,
      width,
      height,
    } = parseResult.data;

    const themeName = theme || 'dark';

    const selectedTheme = themes[themeName as keyof typeof themes] || themes.dark;

    const from = year ? `${year}-01-01T00:00:00Z` : undefined;

    const to = year ? `${year}-12-31T23:59:59Z` : undefined;

    const tzParam = searchParams.get('tz');

    let timezone = 'UTC';

    if (tzParam) {
      try {
        timezone = new Intl.DateTimeFormat(undefined, {
          timeZone: tzParam,
        }).resolvedOptions().timeZone;
      } catch {
        return NextResponse.json(
          {
            error: `Invalid "tz" parameter: ${tzParam}`,
          },
          { status: 400 }
        );
      }
    }

    const params = {
      user,

      bg: bg || selectedTheme.bg,

      text: text || selectedTheme.text,

      accent: accent || selectedTheme.accent,

      radius: radius ? Number(radius) : undefined,

      speed: speed || '8s',

      scale: scale === 'linear' || scale === 'log' ? scale : 'linear',

      font: font || undefined,

      size: size === 'small' || size === 'medium' || size === 'large' ? size : 'medium',

      hide_title: hide_title === 'true',

      hideBackground: hide_background === 'true',

      hide_stats: hide_stats === 'true',

      lang,

      view: view === 'default' || view === 'monthly' ? view : 'default',

      delta_format:
        delta_format === 'percent' || delta_format === 'absolute' || delta_format === 'both'
          ? delta_format
          : 'both',

      width: width ? parseInt(width, 10) : undefined,

      height: height ? parseInt(height, 10) : undefined,
    } as BadgeParams;

    const calendar = await fetchGitHubContributions(user, {
      bypassCache: refresh === 'true',
      from,
      to,
    });

    let svg = '';

    if (view === 'monthly') {
      const stats = calculateMonthlyStats(calendar, timezone);

      svg = generateMonthlySVG(stats, params);
    } else {
      const stats = calculateStreak(calendar, timezone);

      svg = generateSVG(stats, params, calendar);
    }

    const secondsToMidnight = tzParam
      ? getSecondsUntilMidnightInTimezone(timezone)
      : getSecondsUntilUTCMidnight();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',

        'Cache-Control': `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`,

        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="120">
        <rect width="100%" height="100%" fill="#2d0000"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffffff">
          ${escapeXML(message)}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}
