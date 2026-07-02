import { NextRequest, NextResponse } from 'next/server';
import { aggregateTeamData } from '@/lib/analytics/teamHealth';
import type { TeamMember } from '@/types/enterprise';
import type { ContributionCalendar } from '@/types';

function createMockContributionCalendar(): ContributionCalendar {
  const weeks = [];
  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push({
        contributionCount: Math.floor(Math.random() * 20),
        date: new Date(Date.now() - (52 * 7 - w * 7 - d) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
    }
    weeks.push({ contributionDays: days });
  }
  return { totalContributions: Math.floor(Math.random() * 5000) + 1000, weeks };
}

function createMockTeamMembers(usernames: string[]): TeamMember[] {
  return usernames.map((username) => ({
    username,
    avatarUrl: `https://github.com/${username}.png`,
    currentStreak: Math.floor(Math.random() * 30) + 1,
    longestStreak: Math.floor(Math.random() * 100) + 30,
    totalContributions: Math.floor(Math.random() * 1000) + 100,
    lastContributionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId') || 'default-team';
  const teamName = searchParams.get('teamName') || 'Engineering Team';
  const membersParam = searchParams.get('members');

  let members: TeamMember[];
  if (membersParam) {
    try {
      const usernames = membersParam.split(',').filter(Boolean);
      members = createMockTeamMembers(
        usernames.length > 0 ? usernames : ['user1', 'user2', 'user3']
      );
    } catch {
      members = createMockTeamMembers(['user1', 'user2', 'user3']);
    }
  } else {
    members = createMockTeamMembers(['user1', 'user2', 'user3']);
  }

  const contributionCalendar = createMockContributionCalendar();
  const teamHealthData = aggregateTeamData(teamId, teamName, members, contributionCalendar);

  return NextResponse.json(
    {
      success: true,
      data: teamHealthData,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
