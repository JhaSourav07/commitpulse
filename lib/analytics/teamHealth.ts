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

/**
 * Derives a burnout risk score and level from a list of team members.
 *
 * Scoring is based on four signals:
 * 1. **Contributor concentration** — if more than 50 % of members have >500
 *    contributions, the score increases by 30 (knowledge concentration risk).
 * 2. **Average contribution velocity** — teams averaging >300 contributions per
 *    member score +25 (potential overwork indicator).
 * 3. **Engagement decline** — if >30 % of members have been silent for 7+ days,
 *    the score increases by 20.
 * 4. **Perfect activity streak** — when *all* members have contributed in the
 *    last 3 days, a penalty of -15 is applied (reward for healthy cadence).
 *
 * The final score is clamped to [0, 100].  Recommendations are generated
 * based on the resulting level.
 *
 * @param members - Array of `TeamMember` objects to evaluate.
 * @returns A `BurnoutRisk` object containing the numeric score, level, human-readable
 *   indicators, and action recommendations.
 */
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

/**
 * Produces a rolling window of estimated daily contribution velocity trends.
 *
 * Generates `days` data points (default 8) ending at the current date.
 * The contribution count for each day is estimated as the team's average
 * daily rate with a ±15 % random variance. The `velocityScore` is the
 * per-member average contribution count scaled by 10.
 *
 * @param members - Team members whose aggregate contributions inform the estimates.
 * @param days   - Number of historical data points to produce (default 8).
 * @returns An array of `VelocityTrend` objects ordered chronologically.
 */
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

/**
 * Estimates sprint progress for the current two-week sprint window.
 *
 * The sprint window is centered on the current date and spans `SPRINT_DAYS`
 * days (14 days by default). Target contributions are derived from the
 * team's average daily rate extrapolated over the sprint. A fixed 65 %
 * completion factor is used as an optimistic baseline for the current
 * sprint position.
 *
 * @param members    - Team members contributing to the sprint.
 * @param sprintName - Optional label for the sprint (default: "Current Sprint").
 * @returns A `SprintProgress` object with dates, targets, and progress percentage.
 */
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
    // Guard against 0/0 = NaN when every member has 0 total contributions
    // (e.g. a brand-new team with no activity yet).
    progressPercentage:
      targetContributions > 0 ? Math.round((currentContributions / targetContributions) * 100) : 0,
  };
}

/**
 * Aggregates per-member contribution data into summary team metrics.
 *
 * Computes total contributions, active members (contributed in the last 7 days),
 * combined streaks, and the team's average daily contribution rate.
 *
 * @param members - Team members to aggregate.
 * @returns A `TeamMetrics` summary object.
 */
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

/**
 * Derives an overall team health score from metrics and burnout risk.
 *
 * Three sub-dimensions are computed and averaged:
 * - **Productivity** — percentage of team members active in the last 7 days.
 * - **Sustainability** — inverse of the burnout risk score.
 * - **Collaboration** — average current streak as a fraction of a healthy week (7 days).
 *
 * The overall score is the arithmetic mean of the three sub-dimensions. An
 * `excellent` / `good` / `fair` / `poor` / `critical` level label is assigned
 * based on thresholds of 80, 60, 40, and 20.
 *
 * @param metrics      - Pre-computed team metrics.
 * @param burnoutRisk  - Pre-computed burnout risk for the team.
 * @returns A `TeamHealthScore` with sub-dimension scores, overall score, and level.
 */
function calculateTeamHealthScore(metrics: TeamMetrics, burnoutRisk: BurnoutRisk): TeamHealthScore {
  // Guard against 0/0 = NaN and x/0 = Infinity when the team has no members —
  // an empty team should read as "no data" (0), not silently fail every
  // overall >= N comparison below and fall through to 'critical'.
  const productivity =
    metrics.totalMembers > 0
      ? Math.min(100, Math.round((metrics.activeMembers / metrics.totalMembers) * 100))
      : 0;
  const sustainability = Math.max(0, 100 - burnoutRisk.score);
  const collaboration =
    metrics.totalMembers > 0
      ? Math.min(
          100,
          Math.round((metrics.combinedCurrentStreak / (metrics.totalMembers * 7)) * 100)
        )
      : 0;
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
    healthScore,
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
