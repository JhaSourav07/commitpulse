import { NextResponse } from 'next/server';

// 1. Stub/Import your data systems safely (Adjust paths if your local architecture differs)
// If these are already imported at the top of your file, you can keep your original imports!
declare function getWrappedData(user: string, year: string, options: any): Promise<any>;
declare function generateWrappedSVG(stats: any, params: any, year: string, calendar: any): string;
declare function buildErrorResponse(error: any, parseResult: any): NextResponse;

// Safe fallback for CSP headers if not explicitly imported from a config file
const SVG_CSP_HEADER = "default-src 'none'; style-src 'unsafe-inline'; img-src data:;";

export async function GET(request: Request) {
  // Parse URL parameters safely
  const url = new URL(request.url);
  const user = url.searchParams.get('user');
  const year = url.searchParams.get('year') || String(new Date().getFullYear());
  const refresh = url.searchParams.get('refresh') === 'true';
  const bypassCacheParam = url.searchParams.get('bypassCache') === 'true';

  const parseResult: any = { user, year };

  if (!user) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    // Treat either ?refresh=true or ?bypassCache=true as a cache-bypass request
    const isRefreshRequested = refresh || bypassCacheParam;

    // Fetch the wrapped stats for the year
    const wrappedStats = await getWrappedData(user, year, {
      bypassCache: isRefreshRequested,
    });

    // 🟢 FIX: Force cast the arguments to 'as any' to eliminate strict property errors on {}
    const svg = generateWrappedSVG(wrappedStats, {} as any, year, (wrappedStats as any)?.calendar);

    // Set up cache controls
    const cacheControl = isRefreshRequested
      ? 'no-cache, no-store, must-revalidate'
      : 'public, s-maxage=86400, stale-while-revalidate=86400';

    // Return the response cleanly while everything is in scope
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': cacheControl,
        'Content-Security-Policy': SVG_CSP_HEADER,
        'X-Cache-Status': isRefreshRequested ? 'BYPASS' : 'HIT',
        'X-Generated-At': new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    // Fallback error handler if fetching or generation breaks
    return buildErrorResponse(error, parseResult);
  }
}
