import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { fetchUserRepos, aggregateLanguages } from '@/lib/github';
import { generateLanguagesSVG } from '@/lib/svg/languagesCard';
import { buildInlineErrorSVG } from '@/lib/svg/generator';
import { resolveErrorTheme } from '@/lib/svg/themes';
import { validateGitHubUsername } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { RateLimiter, getRateLimitHeaders } from '@/lib/rate-limit';

const languagesLimiter = new RateLimiter(50, 60_000, 1);

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com;";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const errTheme = resolveErrorTheme(searchParams);

  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  const rateLimitResult = await languagesLimiter.checkWithResult(rateLimitKey);
  if (!rateLimitResult.success) {
    return new NextResponse(
      buildInlineErrorSVG('Rate Limit Exceeded', {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 400,
        height: 210,
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

  const user = searchParams.get('username') || searchParams.get('user');

  if (!user || !user.trim()) {
    const isJson = searchParams.get('format') === 'json';
    if (isJson) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    return new NextResponse(
      buildInlineErrorSVG('Username is required', {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 400,
        height: 210,
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

  const cleanUser = user.trim();

  if (!validateGitHubUsername(cleanUser)) {
    const isJson = searchParams.get('format') === 'json';
    if (isJson) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }
    return new NextResponse(
      buildInlineErrorSVG('Invalid username format', {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 400,
        height: 210,
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

  const theme = searchParams.get('theme') || undefined;
  const bg = searchParams.get('bg') || undefined;
  const text = searchParams.get('text') || undefined;
  const accent = searchParams.get('accent') || undefined;
  const title = searchParams.get('title') || undefined;
  const hideTitle =
    searchParams.get('hide_title') === 'true' || searchParams.get('hide_title') === '1';
  const hideBorder =
    searchParams.get('hide_border') === 'true' || searchParams.get('hide_border') === '1';
  const format = searchParams.get('format') || 'svg';
  const rawRadius = searchParams.get('radius');
  const radius = rawRadius ? Number(rawRadius) : undefined;

  try {
    const repos = await fetchUserRepos(cleanUser);
    const languages = aggregateLanguages(repos);

    if (format === 'json') {
      return NextResponse.json({
        username: cleanUser,
        totalRepos: repos.length,
        languages,
      });
    }

    const svg = generateLanguagesSVG(languages, {
      user: cleanUser,
      theme,
      bg,
      text,
      accent,
      title,
      hide_title: hideTitle,
      hide_border: hideBorder,
      radius,
    });

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
    const isJson = format === 'json';

    if (isJson) {
      const status = message.includes('not found') || message.includes('404') ? 404 : 500;
      return NextResponse.json({ error: message || 'Failed to fetch language data' }, { status });
    }

    return new NextResponse(
      buildInlineErrorSVG(message, {
        bg: errTheme.bg,
        accent: errTheme.accent,
        text: errTheme.text,
        radius: errTheme.radius,
        width: 400,
        height: 210,
      }),
      {
        status: message.includes('not found') || message.includes('404') ? 404 : 500,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Content-Security-Policy': SVG_CSP_HEADER,
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
