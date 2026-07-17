// app/api/streak/animated/route.ts

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { Resvg } from '@resvg/resvg-js';
import sharp, { SharpOptions } from 'sharp';
import { GET as getStreakSvg } from '../route';
import { animatedStreakParamsSchema, coerceQueryParams } from '@/lib/validations';
import { getSizeScale } from '@/lib/svg/generator';

export const runtime = 'nodejs';

function solveCubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  let tMin = 0;
  let tMax = 1;
  let t = 0.5;

  for (let i = 0; i < 16; i++) {
    const xt = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
    if (Math.abs(xt - x) < 1e-5) break;
    if (xt < x) {
      tMin = t;
    } else {
      tMax = t;
    }
    t = (tMin + tMax) / 2;
  }

  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}

function getProgress(t_normalized: number, delay: number): number {
  const TOWER_ANIMATION_DURATION = 1.2;
  if (t_normalized < delay) return 0;
  if (t_normalized >= delay + TOWER_ANIMATION_DURATION) return 1;
  return (t_normalized - delay) / TOWER_ANIMATION_DURATION;
}

function getAnimationProps(entrance: string, p: number, sf: number) {
  let scaleY = 1.0;
  let translateY = 0.0;
  let opacity = 1.0;

  if (entrance === 'none') {
    return { scaleY: 1.0, translateY: 0.0, opacity: 1.0 };
  }

  if (entrance === 'rise') {
    const eased = solveCubicBezier(0.16, 1, 0.3, 1, p);
    scaleY = eased;
    opacity = p > 0 ? 1.0 : 0.0;
  } else if (entrance === 'fade') {
    const eased = solveCubicBezier(0, 0, 0.58, 1, p);
    opacity = eased;
  } else if (entrance === 'slide') {
    const eased = solveCubicBezier(0.16, 1, 0.3, 1, p);
    const slideOffset = -20 * sf;
    translateY = slideOffset * (1 - eased);
    opacity = eased;
  } else if (entrance === 'wave') {
    if (p <= 0.5) {
      const p_local = p / 0.5;
      const eased = solveCubicBezier(0.16, 1, 0.3, 1, p_local);
      scaleY = eased * 1.15;
    } else {
      const p_local = (p - 0.5) / 0.5;
      const eased = solveCubicBezier(0.16, 1, 0.3, 1, p_local);
      scaleY = 1.15 - eased * 0.15;
    }
    opacity = p > 0 ? 1.0 : 0.0;
  } else if (entrance === 'bounce') {
    const slideOffset = -40 * sf;
    const bounce1 = -10 * sf;
    const bounce2 = -4 * sf;

    if (p <= 0.5) {
      const p_local = p / 0.5;
      const eased = solveCubicBezier(0.28, 0.84, 0.42, 1, p_local);
      opacity = eased;
      translateY = slideOffset * (1 - eased);
    } else if (p <= 0.7) {
      const p_local = (p - 0.5) / 0.2;
      const eased = solveCubicBezier(0.28, 0.84, 0.42, 1, p_local);
      opacity = 1.0;
      translateY = eased * bounce1;
    } else if (p <= 0.85) {
      const p_local = (p - 0.7) / 0.15;
      const eased = solveCubicBezier(0.28, 0.84, 0.42, 1, p_local);
      opacity = 1.0;
      translateY = bounce1 * (1 - eased);
    } else if (p <= 0.92) {
      const p_local = (p - 0.85) / 0.07;
      const eased = solveCubicBezier(0.28, 0.84, 0.42, 1, p_local);
      opacity = 1.0;
      translateY = eased * bounce2;
    } else {
      const p_local = (p - 0.92) / 0.08;
      const eased = solveCubicBezier(0.28, 0.84, 0.42, 1, p_local);
      opacity = 1.0;
      translateY = bounce2 * (1 - eased);
    }
  }

  return {
    scaleY: Math.round(scaleY * 1000) / 1000,
    translateY: Math.round(translateY * 100) / 100,
    opacity: Math.round(opacity * 100) / 100,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parseResult = animatedStreakParamsSchema.safeParse(coerceQueryParams(searchParams));
  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid parameters';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { format, fps, duration, loop, entrance, size } = parseResult.data;

  // Build the mock request URL forwarding all query params, but forcing format=svg, entrance=none, and minify=false
  const forwardParams = new URLSearchParams(searchParams);
  forwardParams.set('format', 'svg');
  forwardParams.set('entrance', 'none');
  forwardParams.set('minify', 'false');

  const mockUrl = new URL(request.url);
  mockUrl.search = forwardParams.toString();

  const mockHeaders = new Headers(request.headers);
  mockHeaders.delete('if-none-match');
  mockHeaders.delete('if-modified-since');

  const mockRequest = new Request(mockUrl.toString(), {
    headers: mockHeaders,
    method: 'GET',
  });

  const response = await getStreakSvg(mockRequest);
  if (!response.ok || !response.headers.get('Content-Type')?.includes('image/svg+xml')) {
    return response;
  }

  const svgText = await response.text();

  // Find all delay values to compute maxDelay (defaults to 0.87 if not found or empty)
  const delayMatches = Array.from(
    svgText.matchAll(
      /class="cp-tower interactive-tower"[^>]*style="animation-delay:\s*([0-9.]+)s;"/g
    )
  );
  const delays = delayMatches.map((m) => parseFloat(m[1]));
  const maxDelay = delays.length > 0 ? Math.max(...delays) : 0.87;

  // Scale animation to fit into user-specified duration exactly
  const totalDefaultDuration = maxDelay + 1.2;
  const k = duration / totalDefaultDuration;

  const sf = getSizeScale(size);
  const baseY = Math.round(10 * sf * 100) / 100;

  // Parse scan-line animation speed if present
  const rawSpeed = searchParams.get('speed');
  const speedNum = rawSpeed ? parseFloat(rawSpeed) : 8;
  const scanSpeed =
    !isNaN(speedNum) && isFinite(speedNum) && speedNum >= 1 && speedNum <= 60 ? speedNum : 8;

  // Pre-calculate frame count
  const totalFrames = Math.max(1, Math.round(duration * fps));
  const frameBuffers: Buffer[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps;
    const t_normalized = t / k;

    // Apply inline transformations to towers for this frame
    const frameSvg = svgText.replace(
      /class="cp-tower interactive-tower"([^>]*)style="animation-delay:\s*([0-9.]+)s;"/g,
      (match, otherAttrs, delayStr) => {
        const delay = parseFloat(delayStr);
        const p = getProgress(t_normalized, delay);
        const { scaleY, translateY, opacity } = getAnimationProps(entrance, p, sf);
        const inlineStyle = `style="transform-origin: 0 ${baseY}px; transform: scaleY(${scaleY}) translateY(${translateY}px); opacity: ${opacity};"`;
        return `class="cp-tower interactive-tower"${otherAttrs}${inlineStyle}`;
      }
    );

    // If scan-line is present, position it statically for this frame
    const scanStart = 0;
    const scanEnd = 240 * sf;
    const scanY = Math.round(scanStart + (scanEnd - scanStart) * ((t % scanSpeed) / scanSpeed));
    const scanLineRegex = /\.scan-line\s*\{\s*animation:[^;]+;[^}]*\}/g;
    const finalFrameSvg = frameSvg.replace(
      scanLineRegex,
      `
      .scan-line {
        transform: translateY(${scanY}px);
        transform-box: fill-box;
        transform-origin: center;
      }
    `
    );

    // Render SVG frame to PNG
    const resvg = new Resvg(finalFrameSvg, {
      background: 'transparent',
      fitTo: { mode: 'original' },
    });
    frameBuffers.push(resvg.render().asPng());
  }

  // Determine single frame dimensions using sharp
  const metadata = await sharp(frameBuffers[0]).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 350;

  // Stitch frames vertically
  const stitchedImage = sharp({
    create: {
      width,
      height: height * frameBuffers.length,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(
    frameBuffers.map((buffer, index) => ({
      input: buffer,
      top: index * height,
      left: 0,
    }))
  );

  const stitchedBuffer = await stitchedImage.toBuffer();

  const animated = sharp(stitchedBuffer, {
    animated: true,
    pageHeight: height,
  } as SharpOptions);

  const delayMs = Math.round(1000 / fps);
  const sharpLoop = loop <= 0 ? 0 : loop;

  let outputBuffer: Buffer;
  if (format === 'gif') {
    outputBuffer = await animated
      .gif({
        loop: sharpLoop,
        delay: delayMs,
      })
      .toBuffer();
  } else {
    outputBuffer = await animated
      .webp({
        loop: sharpLoop,
        delay: delayMs,
      })
      .toBuffer();
  }

  // Handle client-side ETag caching
  const etag = crypto.createHash('sha256').update(outputBuffer).digest('hex');
  const weakEtag = `W/"${etag}"`;
  const ifNoneMatch = request.headers.get('if-none-match');

  const responseCacheControl = response.headers.get('Cache-Control') || 'no-store';

  if (ifNoneMatch) {
    const etags = ifNoneMatch.split(',').map((e) => e.trim());
    if (etags.includes(weakEtag) || etags.includes(`"${etag}"`)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': responseCacheControl,
          ETag: weakEtag,
        },
      });
    }
  }

  const headers = new Headers();
  headers.set('Content-Type', format === 'gif' ? 'image/gif' : 'image/webp');
  headers.set('Cache-Control', responseCacheControl);
  headers.set('ETag', weakEtag);
  headers.set('X-Cache-Status', response.headers.get('X-Cache-Status') || 'MISS');

  return new NextResponse(new Uint8Array(outputBuffer), {
    status: 200,
    headers,
  });
}
