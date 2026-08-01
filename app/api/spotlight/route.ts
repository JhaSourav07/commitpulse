import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { fetchRepoDetails } from '@/lib/github';
import { generateRepoSpotlightSVG } from '@/lib/svg/repoSpotlight';
import { getNormalizedThemeKey, themes, resolveErrorTheme } from '@/lib/svg/themes';
import { buildInlineErrorSVG } from '@/lib/svg/generator';
import { streakParamsSchema, coerceQueryParams } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { RateLimiter, getRateLimitHeaders } from '@/lib/rate-limit';
import { escapeXML } from '@/lib/svg/sanitizer';

const spotlightLimiter = new RateLimiter(50, 60_000, 1);

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errTheme = resolveErrorTheme(searchParams);

  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await spotlightLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return new NextResponse(
      buildInlineErrorSVG('Rate Limit Exceeded', {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 450,
        height: 160,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Security-Policy': SVG_CSP_HEADER,
          'Cache-Control': 'no-store',
          ...getRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  // repo is required for spotlight
  const repoName = searchParams.get('repo');
  if (!repoName) {
    return new NextResponse(
      buildInlineErrorSVG('Missing repo parameter', {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 450,
        height: 160,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Security-Policy': SVG_CSP_HEADER,
        },
      }
    );
  }

  const parseResult = streakParamsSchema.safeParse(coerceQueryParams(searchParams));
  if (!parseResult.success) {
    return new NextResponse(
      buildInlineErrorSVG('Invalid parameters', {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 450,
        height: 160,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Security-Policy': SVG_CSP_HEADER,
        },
      }
    );
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
          'Cache-Control': 'public, max-age=60, s-maxage=1, stale-while-revalidate=59',
          ETag: weakEtag,
        },
      });
    }

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=1, stale-while-revalidate=59',
        'Content-Security-Policy': SVG_CSP_HEADER,
        ETag: weakEtag,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(
      buildInlineErrorSVG(message, {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 450,
        height: 160,
      }),
      {
        status: message.includes('not found') ? 404 : 500,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Security-Policy': SVG_CSP_HEADER,
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
