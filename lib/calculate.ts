// lib/calculate.ts
import { StreakStats } from '../types';

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export function calculateStreak(calendar: ContributionCalendar): StreakStats {
  const weeks = calendar.weeks;
  const days = weeks.flatMap((week: ContributionWeek) => week.contributionDays);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // 1. Calculate Longest Streak (Standard loop)
  for (const day of days) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // 2. Calculate Current Streak (Backwards loop with Grace Period)
  // We look at the very last day in the array (Today in UTC)
  const todayIndex = days.length - 1;
  const today = days[todayIndex];
  const yesterday = days[todayIndex - 1];

  // If I committed today, the streak is alive.
  // If I haven't committed today, but I committed yesterday, 
  // the streak is STILL alive (Grace Period).
  const isStreakAlive = today.contributionCount > 0 || yesterday.contributionCount > 0;

  if (isStreakAlive) {
    // Count backwards from the first day that has a contribution
    // starting from either today or yesterday.
    let i = today.contributionCount > 0 ? todayIndex : todayIndex - 1;
    
    while (i >= 0 && days[i].contributionCount > 0) {
      currentStreak++;
      i--;
    }
  } else {
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak,
    totalContributions: calendar.totalContributions,
  };
}