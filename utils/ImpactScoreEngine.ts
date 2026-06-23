import { DashboardData } from '@/types/dashboard';

export interface ImpactBreakdown {
  codeFootprint: number;       // Score out of 100
  issueResolution: number;     // Score out of 100
  collaboration: number;       // Score out of 100
  communityInfluence: number;  // Score out of 100
}

export interface ImpactAnalysisResult {
  overallScore: number; // 0-100
  grade: string;        // A+, A, B, etc.
  breakdown: ImpactBreakdown;
  influenceLevel: 'High' | 'Medium' | 'Low' | 'Elite';
}

export function calculateContributionImpact(data: DashboardData): ImpactAnalysisResult {
  const { activity, profile } = data;
  const totalCommits = activity.reduce((sum, d) => sum + d.count, 0);

  // 1. Code Footprint: Based on commits & active days
  const activeDays = activity.filter((d) => d.count > 0).length;
  const codeFootprint = Math.min(
    100,
    Math.round((totalCommits * 0.4) + (activeDays * 2))
  );

  // 2. Issue/PR Activity: Based on repositories count and mock variance
  const issueResolution = Math.min(
    100,
    Math.round(((profile.stats?.repositories || 0) * 3) + 45)
  );

  // 3. Collaboration: Based on followers and following (which maps to members for Orgs)
  const followersCount = profile.stats?.followers || 0;
  const followingCount = profile.stats?.following || 0;
  const collaboration = Math.min(
    100,
    Math.round((followersCount * 0.3) + (followingCount * 0.5) + 30)
  );

  // 4. Community Influence: Based on stars accumulation
  const starsCount = profile.stats?.stars || 0;
  const communityInfluence = Math.min(
    100,
    Math.round((starsCount * 2) + 20)
  );

  // Overall Score calculation (Weighted average)
  const overallScore = Math.round(
    codeFootprint * 0.4 +
    issueResolution * 0.2 +
    collaboration * 0.2 +
    communityInfluence * 0.2
  );

  // Determine Grade
  let grade = 'C';
  if (overallScore >= 95) grade = 'S+';
  else if (overallScore >= 90) grade = 'A+';
  else if (overallScore >= 80) grade = 'A';
  else if (overallScore >= 65) grade = 'B';
  else if (overallScore >= 45) grade = 'C';
  else grade = 'D';

  // Determine Influence Level
  let influenceLevel: ImpactAnalysisResult['influenceLevel'] = 'Low';
  if (overallScore >= 85) influenceLevel = 'Elite';
  else if (overallScore >= 65) influenceLevel = 'High';
  else if (overallScore >= 45) influenceLevel = 'Medium';

  return {
    overallScore,
    grade,
    breakdown: {
      codeFootprint,
      issueResolution,
      collaboration,
      communityInfluence,
    },
    influenceLevel,
  };
}
