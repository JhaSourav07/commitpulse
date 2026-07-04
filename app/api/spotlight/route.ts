import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { fetchRepoDetails } from '@/lib/github';
import { generateRepoSpotlightSVG } from '@/lib/svg/repoSpotlight';
import { getNormalizedThemeKey, themes } from '@/lib/svg/themes';
import { streakParamsSchema, coerceQueryParams } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { RateLimiter, getRateLimitHeaders } from '@/lib/rate-limit';

const spotlightLimiter = new RateLimiter(50, 60_000, 1);

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

function buildInlineErrorSVG(text: string): string {
  const MAX_LINE = 48;
  const truncated = text.length > MAX_LINE * 2 ? text.slice(0, MAX_LINE * 2 - 1) + '…' : text;
  const line1 = truncated.slice(0, MAX_LINE);
  const line2 = truncated.length > MAX_LINE ? truncated.slice(MAX_LINE) : null;
  const textY = line2 ? '62' : '75';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="160" viewBox="0 0 450 160">
  <rect width="450" height="160" fill="#2d0000" rx="8"/>
  <text x="225" y="${textY}" text-anchor="middle" dominant-baseline="central" fill="#ffcccc" font-family="sans-serif" font-size="13">${line1}</text>${
    line2
      ? `\n    <text x="225" y="91" text-anchor="middle" dominant-baseline="central" fill="#ffcccc" font-family="sans-serif" font-size="13">${line2}</text>`
      : ''
  }
  </svg>`;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await spotlightLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return new NextResponse(buildInlineErrorSVG('Rate Limit Exceeded'), {
      status: 429,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  }

  const { searchParams } = new URL(request.url);

  // repo is required for spotlight
  const repoName = searchParams.get('repo');
  if (!repoName) {
    return new NextResponse(buildInlineErrorSVG('Missing repo parameter'), {
      status: 400,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
    });
  }

  const parseResult = streakParamsSchema.safeParse(coerceQueryParams(searchParams));
  if (!parseResult.success) {
    return new NextResponse(buildInlineErrorSVG('Invalid parameters'), {
      status: 400,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
    });
  }

  const { user, theme, bg, text, accent, format } = parseResult.data;

  const themeKey = getNormalizedThemeKey(theme);
  const themeName = themeKey === 'default' && theme ? theme : themeKey;

  const isAutoTheme = themeName.toLowerCase() === 'auto';
  const selectedTheme = themes[themeKey] || themes.dark;

  const params = {
    ...parseResult.data,
    bg: isAutoTheme ? selectedTheme.bg : bg || selectedTheme.bg,
    text: isAutoTheme ? selectedTheme.text : text || selectedTheme.text,
    accent: isAutoTheme ? selectedTheme.accent : accent || selectedTheme.accent,
  };

  try {
    const repoDetails = await fetchRepoDetails(user, repoName);

    if (format === 'json') {
      return NextResponse.json(repoDetails);
    }

    const svg = generateRepoSpotlightSVG(repoDetails, params);

    const etag = crypto.createHash('sha256').update(svg).digest('hex');
    const weakEtag = `W/"${etag}"`;
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch.includes(etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60',
          ETag: weakEtag,
        },
      });
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=60',
        'Content-Security-Policy': SVG_CSP_HEADER,
        ETag: weakEtag,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(buildInlineErrorSVG(message), {
      status: message.includes('not found') ? 404 : 500,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}
