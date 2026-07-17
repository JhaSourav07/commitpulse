import { NextResponse } from 'next/server';
import { fetchGitHubContributions } from '@/lib/github';
import { activityToTowers, generateMonolithSTL } from '@/lib/export3d';
import { streakParamsSchema, coerceQueryParams } from '@/lib/validations';
import type { ActivityData } from '@/types/dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parseResult = streakParamsSchema.safeParse(coerceQueryParams(searchParams));

    if (!parseResult.success) {
      return new NextResponse('Invalid parameters', { status: 400 });
    }

    const { user, year } = parseResult.data;

    // We only support single-user STL generation currently
    const targetUser = user.split(',')[0].trim();

    let from: string | undefined = undefined;
    let to: string | undefined = undefined;

    if (year) {
      from = `${year}-01-01T00:00:00Z`;
      to = `${year}-12-31T23:59:59Z`;
    }

    const userData = await fetchGitHubContributions(targetUser, {
      from,
      to,
    });

    if (!userData || !userData.calendar) {
      return new NextResponse('Could not fetch user data', { status: 500 });
    }

    const { calendar } = userData;

    // Flatten weeks into ActivityData format
    const days = calendar.weeks.flatMap((w) => w.contributionDays);
    const maxCount = Math.max(...days.map((d) => d.contributionCount), 1);

    const activity: ActivityData[] = days.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      intensity: (day.contributionCount === 0
        ? 0
        : Math.min(
            Math.ceil((day.contributionCount / maxCount) * 4),
            4
          )) as ActivityData['intensity'],
    }));

    const towers = activityToTowers(activity);
    const stlData = generateMonolithSTL(towers);

    return new NextResponse(stlData, {
      status: 200,
      headers: {
        'Content-Type': 'model/stl',
        'Content-Disposition': `attachment; filename="${targetUser}-commitpulse.stl"`,
        'Cache-Control': 'public, max-age=60, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating 3D STL:', error);
    return new NextResponse('Error generating 3D STL', { status: 500 });
  }
}
