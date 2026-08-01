// utils/calculateLearningCurve.ts

import { getAcademicDomain, AcademicDomain } from '@/lib/educational/syllabus-mapper';
import { LearningCurveData, LearningCurveDataPoint } from '@/types/student';

/**
 * Generic interface representing raw commit data fetched from GitHub.
 */
export interface RawCommitActivity {
  date: string; // ISO Date string (YYYY-MM-DD)
  language: string;
  linesAdded: number;
  linesDeleted: number;
}

export function calculateLearningCurve(activities: RawCommitActivity[]): LearningCurveData {
  const timelineMap = new Map<string, LearningCurveDataPoint>();
  const domainTotals = new Map<AcademicDomain, number>();
  let totalStudyDays = 0;

  // Process raw commits into chronological data points
  activities.forEach((activity) => {
    const domain = getAcademicDomain(activity.language);

    // Skip if we don't want to track generic uncategorized files in the syllabus curve
    if (domain === 'General Purpose / Uncategorized') return;

    if (!timelineMap.has(activity.date)) {
      timelineMap.set(activity.date, {
        date: activity.date,
        domains: {},
        totalDailyCommits: 0,
      });
      totalStudyDays++;
    }

    const dayData = timelineMap.get(activity.date)!;
    dayData.totalDailyCommits += 1;

    // Initialize or update domain stats for that specific day
    if (!dayData.domains[domain]) {
      dayData.domains[domain] = {
        domain,
        commitCount: 0,
        linesAdded: 0,
        linesDeleted: 0,
        primaryLanguagesUsed: [],
      };
    }

    const domainStat = dayData.domains[domain]!;
    domainStat.commitCount += 1;
    domainStat.linesAdded += activity.linesAdded;
    domainStat.linesDeleted += activity.linesDeleted;

    if (!domainStat.primaryLanguagesUsed.includes(activity.language)) {
      domainStat.primaryLanguagesUsed.push(activity.language);
    }

    // Keep track of all-time totals to find the primary domain
    domainTotals.set(domain, (domainTotals.get(domain) || 0) + 1);
  });

  // Determine Primary Domain (e.g., heavily weighting towards Applied AI or Full-Stack)
  let primaryDomain: AcademicDomain = 'General Purpose / Uncategorized';
  let maxCommits = 0;

  domainTotals.forEach((count, domain) => {
    if (count > maxCommits) {
      maxCommits = count;
      primaryDomain = domain;
    }
  });

  // Sort timeline chronologically
  const timeline = Array.from(timelineMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    timeline,
    primaryDomain,
    totalStudyDays,
  };
}
