// lib/persona.ts

interface ContributionDay {
  date: string;
  contributionCount: number;
}

export function generateDeveloperPersona(days: ContributionDay[], longestStreak: number): string {
  let totalCommits = 0;
  let weekendCommits = 0;
  let activeDays = 0;

  days.forEach((day) => {
    if (day.contributionCount > 0) {
      totalCommits += day.contributionCount;
      activeDays += 1;

      // Parse the date to check if it's a Saturday (6) or Sunday (0)
      const dayOfWeek = new Date(day.date).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCommits += day.contributionCount;
      }
    }
  });

  if (activeDays === 0) return '👻 The Ghost';

  const weekendRatio = weekendCommits / totalCommits;
  const commitsPerActiveDay = totalCommits / activeDays;

  // Inference Ruleset
  if (longestStreak > 30) {
    return '🏃‍♂️ The Marathoner';
  }

  if (weekendRatio > 0.4) {
    return '🚀 Weekend Warrior';
  }

  if (commitsPerActiveDay > 10) {
    return '🔥 Deep Diver';
  }

  return '☕ Steady Contributor';
}
