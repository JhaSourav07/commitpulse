// app/api/profile/[username]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubContributions } from '@/lib/github';
import { generateSVG } from '@/lib/svg/generator';
import { renderStackLegend, shouldRenderStackVisualization } from '@/lib/svg/stackVisualization';
import { generateStackAnalytics } from '@/lib/analytics/stackAggregator';
import { getCachedStackAnalytics, cacheStackAnalytics } from '@/lib/analytics/mongodb-schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { searchParams } = req.nextUrl;
  const stackEnabled = searchParams.get('stack') === 'true';
  const returnJson = searchParams.get('format') === 'json';

  if (!username) {
    return NextResponse.json({ error: 'Invalid username.' }, { status: 400 });
  }

  try {
    // Step 1: Fetch GitHub data
    const githubData = await fetchGitHubContributions(username);
    const repoContributions = githubData.repoContributions ?? [];
    const totalContributions = githubData.calendar?.totalContributions ?? 0;

    // Step 2: Get stack analytics (cache first, then compute)
    let stackAnalytics = null;
    if (stackEnabled || returnJson) {
      stackAnalytics = await getCachedStackAnalytics(username);
      if (!stackAnalytics) {
        stackAnalytics = generateStackAnalytics(repoContributions, totalContributions);
        cacheStackAnalytics(username, stackAnalytics).catch(() => {});
      }
    }

    // Step 3: Return JSON if ?format=json
    if (returnJson) {
      return NextResponse.json({ username, ...stackAnalytics }, { status: 200 });
    }

    // Step 4: Generate base SVG
    const { stats, params: badgeParams, calendar } = githubData as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const svgBody: string = generateSVG(stats, badgeParams, calendar);

    // Step 5: Inject legend if ?stack=true
    let finalSVG = svgBody;
    if (stackEnabled && stackAnalytics && shouldRenderStackVisualization(stackAnalytics)) {
      const legend = renderStackLegend(stackAnalytics, 20, 20, 5);
      finalSVG = svgBody.replace('</svg>', `${legend}\n</svg>`);
    }

    // Step 6: Return SVG
    return new NextResponse(finalSVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=21600',
      },
    });
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error(`[/api/profile/${username}]`, err?.message ?? err);
    if (err?.message?.includes('Could not resolve to a User')) {
      return NextResponse.json({ error: `GitHub user "${username}" not found.` }, { status: 404 });
    }
    if (err?.message?.includes('rate limit')) {
      return NextResponse.json({ error: 'GitHub API rate limit reached.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

