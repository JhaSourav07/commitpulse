import { NextRequest, NextResponse } from 'next/server';

type ContributionDay = {
  date: string;
  count: number;
};

type ContributionWeek = ContributionDay[];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const username = searchParams.get('user');

  if (!username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);

    const data = await response.json();

    const days = data.contributions.flatMap((week: ContributionWeek) =>
      week.map((day: ContributionDay) => ({
        date: day.date,
        count: day.count,
        weekday: new Date(day.date).getDay(),
      }))
    );

    return NextResponse.json({ days });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}
