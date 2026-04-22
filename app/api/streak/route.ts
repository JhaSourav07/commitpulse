// app/api/streak/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';
import { generateSVG } from '../../../lib/svg/generator';
import { getSecondsUntilUTCMidnight } from '../../../utils/time';
import type { BadgeParams } from '../../../types';
import { themes } from '../../../lib/svg/themes';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');

    if (!user) {
      return new NextResponse('Missing "user" parameter', { status: 400 });
    }

    const themeName = searchParams.get('theme') || 'dark';
    const selectedTheme = themes[themeName] || themes.dark;

    const rawSpeed = searchParams.get('speed') || '8s';
    const speed = /^\d+(\.\d+)?s$/.test(rawSpeed) ? rawSpeed : '8s';

    const rawScale = searchParams.get('scale');
    const scale = rawScale === 'log' ? 'log' : 'linear';

    const font = searchParams.get('font') || undefined;

    const params: BadgeParams = {
      user,
      bg: searchParams.get('bg') || selectedTheme.bg,
      text: searchParams.get('text') || selectedTheme.text,
      accent: searchParams.get('accent') || selectedTheme.accent,
      radius: searchParams.get('radius') || '8',
      speed,
      scale,
      font,
    };

    const calendar = await fetchGitHubContributions(user);
    const stats = calculateStreak(calendar);

    const svg = generateSVG(stats, params, calendar);

    // 4. Calculate Cache Control (Reset at UTC Midnight)
    const secondsToMidnight = getSecondsUntilUTCMidnight();
    const refresh = searchParams.get('refresh') === 'true';
    const cacheControl = refresh
      ? 'no-cache, no-store, must-revalidate'
      : `public, s-maxage=${secondsToMidnight}, stale-while-revalidate=86400`;

    // 5. Return the Image Response
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,

        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;",
      },
    });
  } catch (error: unknown) {
    console.error('Streak API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">
        <rect width="100%" height="100%" fill="#2d0000" rx="8"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffcccc" font-family="sans-serif" font-size="14">
          Error: ${message}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
