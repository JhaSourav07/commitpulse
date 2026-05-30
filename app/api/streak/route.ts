import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  const filter = searchParams.get('filter') ?? 'all';

  if (!user) {
    return NextResponse.json({ error: 'Missing user param' }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  const res = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: QUERY, variables: { login: user } }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'GitHub API error' }, { status: 502 });
  }

  const json = await res.json();
  const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;

  if (!weeks) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const allDays: { date: string; count: number; weekday: number }[] = weeks.flatMap(
    (w: { contributionDays: { date: string; contributionCount: number; weekday: number }[] }) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        weekday: d.weekday,
      }))
  );

  const now = Date.now();
  const MS = 86400000;
  const filtered = allDays.filter((d) => {
    const t = new Date(d.date).getTime();
    if (filter === '30d') return now - t <= 30 * MS;
    if (filter === '6m') return now - t <= 180 * MS;
    if (filter === '1y') return now - t <= 365 * MS;
    return true;
  });

  return NextResponse.json({ days: filtered, username: user });
}
