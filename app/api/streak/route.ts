// app/api/streak/route.ts
import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '../../../lib/github';
import { calculateStreak } from '../../../lib/calculate';
import { generateSVG } from '../../../lib/svg/generator';
import { BadgeParams } from '../../../types';
import { themes } from '../../../lib/svg/themes';

export async function GET(request: Request) {
  try {
    // 1. Parse URL Parameters
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');

    if (!user) {
      return new NextResponse('Missing "user" parameter', { status: 400 });
    }

    // Look up theme from our library, fallback to 'dark'
    const themeName = searchParams.get('theme') || 'dark';
    const selectedTheme = themes[themeName] || themes['dark'];

    // Parse speed: validate it's a number followed by 's', default to '8s'
    const rawSpeed = searchParams.get('speed') || '8s';
    const speed = /^\d+(\.\d+)?s$/.test(rawSpeed) ? rawSpeed : '8s';

    // Parse scale: only 'log' or 'linear' (default)
    const rawScale = searchParams.get('scale');
    const scale = rawScale === 'log' ? 'log' : 'linear';

    const params: BadgeParams = {
      user,
      // Priority: URL Param > Theme Default > Fallback
      bg: searchParams.get('bg') || selectedTheme.bg,
      text: searchParams.get('text') || selectedTheme.text,
      accent: searchParams.get('accent') || selectedTheme.accent,
      radius: searchParams.get('radius') || '8',
      speed,
      scale,
    };

    // 2. Fetch Data & Calculate Stats
    const calendar = await fetchGitHubContributions(user);
    const stats = calculateStreak(calendar);

    // 3. Generate the SVG string
    const svg = generateSVG(stats, params, calendar);


    // 5. Return the Image Response
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        // max-age=0 tells GitHub NOT to cache it for long
        // s-maxage=0 tells the Vercel Edge cache the same
        // must-revalidate forces the proxy to check for updates
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline';",
      },
    });
  } catch (error: unknown) {
    console.error('Streak API Error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

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
