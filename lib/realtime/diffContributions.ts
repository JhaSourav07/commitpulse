import type { ContributionCalendar, ContributionDay } from '@/types';

export interface ContributionDelta {
  type: 'streak_change' | 'contribution_added';
  payload: {
    username: string;
    date?: string;
    count?: number;
    currentStreak?: number;
    longestStreak?: number;
    totalContributions?: number;
  };
}

export function diffContributions(
  username: string,
  oldCalendar: ContributionCalendar | null,
  newCalendar: ContributionCalendar
): ContributionDelta[] {
  const deltas: ContributionDelta[] = [];
  if (!oldCalendar) {
    return deltas;
  }

  // Helper to flatten weeks into days
  const getDays = (cal: ContributionCalendar): ContributionDay[] => {
    return (cal.weeks || []).flatMap((w) => w.contributionDays || []);
  };

  const oldDays = getDays(oldCalendar);
  const newDays = getDays(newCalendar);

  // Compare contributions per day
  const oldDaysMap = new Map<string, number>();
  for (const d of oldDays) {
    oldDaysMap.set(d.date, d.contributionCount);
  }

  for (const d of newDays) {
    const prevCount = oldDaysMap.get(d.date) ?? 0;
    if (d.contributionCount > prevCount) {
      deltas.push({
        type: 'contribution_added',
        payload: {
          username,
          date: d.date,
          count: d.contributionCount - prevCount,
        },
      });
    }
  }

  return deltas;
}
