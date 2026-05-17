import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';
import { generateSVG } from '../../../lib/svg/generator';
import type { BadgeParams } from '../../../types';
import { themes } from '../../../lib/svg/themes';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const user = searchParams.get('user');

    if (!user) {
      return new NextResponse('Missing "user" parameter', {
        status: 400,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    const yearParam = searchParams.get('year');

    const from = yearParam
      ? `${yearParam}-01-01T00:00:00Z`
      : undefined;

    const to = yearParam
      ? `${yearParam}-12-31T23:59:59Z`
      : undefined;

    const themeName = searchParams.get('theme') || 'dark';

    const isAutoTheme = themeName === 'auto';

    const selectedTheme =
      isAutoTheme
        ? themes.light
        : themes[themeName] || themes.dark;

    const rawSpeed = searchParams.get('speed') || '8s';

    const speed = /^\d+(\.\d+)?s$/.test(rawSpeed)
      ? rawSpeed
      : '8s';

    const rawScale = searchParams.get('scale');

    const scale = rawScale === 'log'
      ? 'log'
      : 'linear';

    const font = searchParams.get('font') || undefined;

    const params: BadgeParams = {
      user,
      bg: isAutoTheme
        ? selectedTheme.bg
        : searchParams.get('bg') || selectedTheme.bg,

      text: isAutoTheme
        ? selectedTheme.text
        : searchParams.get('text') || selectedTheme.text,

      accent: isAutoTheme
        ? selectedTheme.accent
        : searchParams.get('accent') || selectedTheme.accent,

      radius: searchParams.get('radius') || '8',
      speed,
      scale,
      font,
      autoTheme: isAutoTheme,
    };

    const calendar = await fetchGitHubContributions(user, {
      bypassCache: searchParams.get('refresh') === 'true',
      from,
      to,
    });

    const stats = calculateStreak(calendar);

    const svg = generateSVG(stats, params, calendar);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',

        // Optimized CDN caching
        'Cache-Control':
          'public, max-age=0, s-maxage=14400, stale-while-revalidate=86400',

        // Security headers
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;",

        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Streak API Error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error';

    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          fill="#ffcccc"
          font-family="sans-serif"
          font-size="14"
        >
          Error: ${message}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control':
          'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      },
    });
  }
}
