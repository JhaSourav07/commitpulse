import { GET as getStreakSvg } from '../route';
import { Resvg } from '@resvg/resvg-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Call the original endpoint which returns the SVG text
  const response = await getStreakSvg(request);

  if (!response.ok || response.headers.get('Content-Type') !== 'image/svg+xml') {
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

    return new NextResponse(pngBuffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to convert SVG to PNG', details: String(err) },
      { status: 500 }
    );
  }
}
