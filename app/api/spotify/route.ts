// app/api/spotify/route.ts

import { NextResponse } from 'next/server';
import { getCurrentlyPlaying } from '@/services/spotify/api';
import { generateSpotifySVG } from '@/lib/svg/spotify';
import { buildInlineErrorSVG } from '@/lib/svg/generator';
import { resolveErrorTheme } from '@/lib/svg/themes';
import { spotifyParamsSchema, coerceQueryParams } from '@/lib/validations';
import { optimizeSVG } from '@/lib/svg/optimizer';
import crypto from 'crypto';

const SVG_CSP_HEADER =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://fonts.gstatic.com; img-src data:;";

/**
 * Fetch an image and convert it to a base64 data URI
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // Do not use 'force-cache' here: it caches the fetch indefinitely with
    // no revalidation, which (combined with the outer SVG response cache)
    // is what lets stale album artwork keep being served after the track
    // has changed. A short revalidate window still avoids re-downloading
    // the image on every single request, but ensures it can't be served
    // stale for longer than the "Now Playing" data itself.
    const response = await fetch(url, { next: { revalidate: 30 } });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.warn('Error fetching image for base64 encoding:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = spotifyParamsSchema.safeParse(coerceQueryParams(searchParams));

  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid parameters';

    const errTheme = resolveErrorTheme(searchParams);
    const errorSvg = buildInlineErrorSVG(firstError, {
      bg: errTheme.bg,
      accent: errTheme.accent,
      text: errTheme.text,
      radius: errTheme.radius,
    });

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

  const trackData = await getCurrentlyPlaying();
  let imageBase64: string | null = null;

  if (trackData.isPlaying && trackData.albumImageUrl) {
    imageBase64 = await fetchImageAsBase64(trackData.albumImageUrl);
  }

  let svg = await generateSpotifySVG(trackData, params, imageBase64);

  if (params.minify) {
    svg = optimizeSVG(svg);
  }

  const isRefreshRequested = params.refresh || params.bypassCache;
  // Keep a short cache window so repeated card loads don't hammer the
  // Spotify API, but make sure it can't stay stale for very long after
  // the user switches tracks: a client/CDN will treat the response as
  // fresh for 10s, and may serve a stale copy for at most another 10s
  // while it revalidates in the background (max ~20s of staleness,
  // versus the previous worst case of up to 60s).
  const cacheControl = isRefreshRequested
    ? 'no-cache, no-store, must-revalidate'
    : 'public, max-age=10, s-maxage=10, stale-while-revalidate=10';

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
