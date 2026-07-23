import { NextResponse } from 'next/server';
import { getWakaTimeStats } from '@/services/wakatime/api';
import { generateWakaTimeSVG } from '@/lib/svg/wakatime';
import { wakatimeParamsSchema, coerceQueryParams } from '@/lib/validations';
import { optimizeSVG } from '@/lib/svg/optimizer';
import crypto from 'crypto';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com; img-src data:;";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = wakatimeParamsSchema.safeParse(coerceQueryParams(searchParams));

  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid parameters';

    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150">
      <rect width="400" height="150" fill="#2d0000" rx="8"/>
      <text x="200" y="75" text-anchor="middle" dominant-baseline="central" fill="#ffcccc" font-family="sans-serif" font-size="13">${firstError}</text>
    </svg>`;

    return new NextResponse(errorSvg, {
      status: 400,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': SVG_CSP_HEADER,
      },
    });
  }

  const params = parseResult.data;

  const stats = await getWakaTimeStats();

  let svg = generateWakaTimeSVG(stats, params);

  if (params.minify) {
    svg = optimizeSVG(svg);
  }

  const isRefreshRequested = params.refresh || params.bypassCache;
  const cacheControl = isRefreshRequested
    ? 'no-cache, no-store, must-revalidate'
    : 'public, max-age=30, s-maxage=30, stale-while-revalidate=30';

  const etag = crypto.createHash('sha256').update(svg).digest('hex');
  const weakEtag = `W/"${etag}"`;
  const ifNoneMatch = request.headers.get('if-none-match');

  if (ifNoneMatch) {
    const etags = ifNoneMatch.split(',').map((e) => e.trim());
    if (etags.includes(weakEtag) || etags.includes(`"${etag}"`)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': cacheControl,
          ETag: weakEtag,
        },
      });
    }
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': cacheControl,
      'Content-Security-Policy': SVG_CSP_HEADER,
      ETag: weakEtag,
    },
  });
}
