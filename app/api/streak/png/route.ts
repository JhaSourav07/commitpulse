import { GET as getStreakSvg } from '../route';
import { Resvg } from '@resvg/resvg-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Call the original endpoint which returns the SVG text
  const response = await getStreakSvg(request);

  if (!response.ok || !response.headers.get('Content-Type')?.includes('image/svg+xml')) {
    // Return errors as is
    return response;
  }

  const svgText = await response.text();

  try {
    const resvg = new Resvg(svgText, {
      font: {
        loadSystemFonts: true,
      },
      fitTo: {
        mode: 'original',
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Preserve the original cache headers
    const cacheControl = response.headers.get('Cache-Control');

    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    if (cacheControl) {
      headers.set('Cache-Control', cacheControl);
    }

    return new NextResponse(pngBuffer as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[streak/png] Failed to convert SVG to PNG:', err);
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="20" y="55" font-family="monospace" font-size="16" fill="red">
    Failed to render streak image
  </text>
</svg>`;

    return new NextResponse(errorSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store',
      },
    });
  }
}
