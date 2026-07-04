import type {
  TeamMember,
  TeamMetrics,
  SprintProgress,
  VelocityTrend,
  BurnoutRisk,
  TeamHealthData,
  TeamHealthScore,
  HealthScoreLevel,
} from '@/types/enterprise';
import type { ContributionCalendar } from '@/types';

const SPRINT_DAYS = 14;

function calculateBurnoutRisk(members: TeamMember[]): BurnoutRisk {
  const highContributionMembers = members.filter((m) => m.totalContributions > 500);
  const avgContributions =
    members.length > 0
      ? members.reduce((sum, m) => sum + m.totalContributions, 0) / members.length
      : 0;

  const indicators: string[] = [];
  let score = 0;

  if (highContributionMembers.length > members.length * 0.5) {
    indicators.push('High contributor concentration detected');
    score += 30;
  }

  if (avgContributions > 300) {
    indicators.push('Above average contribution velocity');
    score += 25;
  }

  const noRecentActivity = members.filter(
    (m) => new Date(m.lastContributionDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  if (noRecentActivity.length > members.length * 0.3) {
    indicators.push('Team engagement declining');
    score += 20;
  }

  const recentContributors = members.filter(
    (m) => new Date(m.lastContributionDate) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  );
  if (recentContributors.length === members.length) {
    indicators.push('Perfect recent activity streak');
    score -= 15;
  }

  const level: BurnoutRisk['level'] =
    score >= 60 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';

  const recommendations: string[] = [];
  if (level === 'critical' || level === 'high') {
    recommendations.push('Consider implementing mandatory team breaks');
    recommendations.push('Redistribute workload across team members');
    recommendations.push('Review project timeline and scope');
  }
  if (level === 'medium') {
    recommendations.push('Monitor contribution patterns weekly');
    recommendations.push('Encourage sustainable pacing');
  }
  if (level === 'low') {
    recommendations.push('Maintain current healthy practices');
  }

  return { level, score: Math.max(0, Math.min(100, score)), indicators, recommendations };
}

function calculateVelocityTrends(members: TeamMember[], days: number = 8): VelocityTrend[] {
  const trends: VelocityTrend[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const weekStr = date.toISOString().split('T')[0];

    const estimatedDaily =
      members.length > 0 ? members.reduce((s, m) => s + m.totalContributions, 0) / 365 : 0;
    const variance = Math.random() * 0.3 + 0.85;
    const contributions = Math.round(estimatedDaily * variance);

    trends.push({
      week: weekStr,
      contributions,
      velocityScore: Math.round((contributions / (members.length || 1)) * 10),
    });
  }

  return trends;
}

function calculateSprintProgress(
  members: TeamMember[],
  sprintName: string = 'Current Sprint'
): SprintProgress {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - Math.floor(SPRINT_DAYS / 2));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + SPRINT_DAYS);

  const totalContributions = members.reduce((sum, m) => sum + m.totalContributions, 0);
  const dailyRate = totalContributions / 365;
  const sprintDays = SPRINT_DAYS;
  const targetContributions = Math.round(dailyRate * sprintDays * members.length);
  const currentContributions = Math.round(targetContributions * 0.65);

  return {
    name: sprintName,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    targetContributions,
    currentContributions,
    progressPercentage: Math.round((currentContributions / targetContributions) * 100),
  };
}

function calculateTeamMetrics(members: TeamMember[]): TeamMetrics {
  const totalContributions = members.reduce((sum, m) => sum + m.totalContributions, 0);
  const activeMembers = members.filter(
    (m) => new Date(m.lastContributionDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return {
    totalMembers: members.length,
    combinedContributions: totalContributions,
    combinedCurrentStreak: members.reduce((sum, m) => sum + m.currentStreak, 0),
    combinedLongestStreak: Math.max(...members.map((m) => m.longestStreak), 0),
    averageDailyContributions: Math.round(totalContributions / 365),
    activeMembers,
  };
}

function calculateTeamHealthScore(metrics: TeamMetrics, burnoutRisk: BurnoutRisk): TeamHealthScore {
  const productivity = Math.min(
    100,
    Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
  );
  const sustainability = Math.max(0, 100 - burnoutRisk.score);
  const collaboration = Math.min(
    100,
    Math.round((metrics.combinedCurrentStreak / (metrics.totalMembers * 7)) * 100)
  );
  const overall = Math.round((productivity + sustainability + collaboration) / 3);

  let level: HealthScoreLevel;
  if (overall >= 80) level = 'excellent';
  else if (overall >= 60) level = 'good';
  else if (overall >= 40) level = 'fair';
  else if (overall >= 20) level = 'poor';
  else level = 'critical';

  return { overall, productivity, sustainability, collaboration, level };
}

export function aggregateTeamData(
  teamId: string,
  teamName: string,
  members: TeamMember[],
  contributionCalendar: ContributionCalendar
): TeamHealthData {
  const metrics = calculateTeamMetrics(members);
  const sprintProgress = [calculateSprintProgress(members)];
  const velocityTrends = calculateVelocityTrends(members);
  const burnoutRisk = calculateBurnoutRisk(members);
  const healthScore = calculateTeamHealthScore(metrics, burnoutRisk);

  return {
    teamId,
    teamName,
    members,
    metrics,
    sprintProgress,
    velocityTrends,
    burnoutRisk,
    contributionCalendar,
    generatedAt: new Date().toISOString(),
  };
}

export {
  calculateBurnoutRisk,
  calculateVelocityTrends,
  calculateSprintProgress,
  calculateTeamMetrics,
};
