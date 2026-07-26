/**
 * calculateBurnoutRisk — Client-side utility that derives an overall
 * repository burnout-risk score (0–100) from a BurnoutReport object.
 *
 * Weighted scoring dimensions:
 *   Commit frequency decline  — 25 %
 *   Contributor concentration — 25 %
 *   Issue response delays     — 20 % (proxied via sustainabilityScore)
 *   PR backlog                — 15 % (proxied via dependencyRisk)
 *   Inactivity spikes         — 15 %
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal slice of ContributorMetric the calculator needs. */
export interface ContributorSlice {
  commitShare: number;
  recentTrend: number[];
}

/** Minimal slice of InactivityAlert the calculator needs. */
export interface InactivityAlertSlice {
  weeksSilent: number;
  severity: 'Medium' | 'High';
}

/** A single actionable recommendation produced by the calculator. */
export interface BurnoutRecommendation {
  icon: string; // lucide-react icon name key
  title: string;
  description: string;
}

/** The full result object returned by calculateBurnoutRisk. */
export interface BurnoutRiskResult {
  score: number; // 0–100
  level: 'Low' | 'Moderate' | 'High';
  description: string;
  recommendations: BurnoutRecommendation[];
}

/** Input shape — mirrors the relevant fields of BurnoutReport. */
export interface BurnoutRiskInput {
  sustainabilityScore: number;
  busFactor: number;
  dependencyRisk: 'Low' | 'Medium' | 'High';
  contributors: ContributorSlice[];
  inactivityAlerts: InactivityAlertSlice[];
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const WEIGHT_COMMIT_DECLINE = 0.25;
const WEIGHT_CONCENTRATION = 0.25;
const WEIGHT_ISSUE_DELAYS = 0.2;
const WEIGHT_PR_BACKLOG = 0.15;
const WEIGHT_INACTIVITY = 0.15;

// ---------------------------------------------------------------------------
// Dimension calculators — each returns a normalised 0–100 sub-score
// ---------------------------------------------------------------------------

/**
 * Measures average commit frequency decline across contributors.
 * Compares the last 3 weeks of each contributor's recentTrend to
 * the preceding weeks. A steeper decline → higher sub-score.
 */
export function measureCommitDecline(contributors: ContributorSlice[]): number {
  if (contributors.length === 0) return 0;

  let totalDeclineRatio = 0;
  let counted = 0;

  for (const c of contributors) {
    const trend = c.recentTrend;
    if (!trend || trend.length < 6) continue;

    const recent3 = trend.slice(-3);
    const preceding = trend.slice(0, -3);

    const avgRecent = recent3.reduce((a, b) => a + b, 0) / recent3.length;
    const avgPreceding =
      preceding.length > 0 ? preceding.reduce((a, b) => a + b, 0) / preceding.length : 0;

    if (avgPreceding > 0) {
      // Ratio of decline: 1 means total halt, 0 means stable, negative means growth
      const decline = Math.max(0, 1 - avgRecent / avgPreceding);
      totalDeclineRatio += decline;
      counted++;
    }
  }

  if (counted === 0) return 0;
  // Average decline ratio → scale to 0–100
  return Math.min(100, (totalDeclineRatio / counted) * 100);
}

/**
 * Measures contributor concentration.
 * Top contributor's commitShare directly maps to risk.
 */
export function measureConcentration(contributors: ContributorSlice[]): number {
  if (contributors.length === 0) return 0;
  const topShare = Math.max(...contributors.map((c) => c.commitShare));
  // 100% share → 100 risk, < 20% share → ≈ 0 risk
  return Math.min(100, Math.max(0, topShare));
}

/**
 * Proxies issue response delay risk from the sustainability score.
 * A low sustainability score implies slower responses / poorer health.
 */
export function measureIssueDelays(sustainabilityScore: number): number {
  // Inverse: 100 sustainability → 0 risk, 0 sustainability → 100 risk
  return Math.min(100, Math.max(0, 100 - sustainabilityScore));
}

/**
 * Proxies PR backlog risk from dependencyRisk level.
 */
export function measurePRBacklog(dependencyRisk: 'Low' | 'Medium' | 'High'): number {
  switch (dependencyRisk) {
    case 'High':
      return 85;
    case 'Medium':
      return 45;
    default:
      return 10;
  }
}

/**
 * Measures inactivity spikes from the inactivity alerts list.
 */
export function measureInactivity(alerts: InactivityAlertSlice[]): number {
  if (alerts.length === 0) return 0;

  let penalty = 0;
  for (const a of alerts) {
    penalty += a.severity === 'High' ? 30 : 15;
    penalty += Math.min(20, a.weeksSilent * 3);
  }
  return Math.min(100, penalty);
}

// ---------------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------------

function generateRecommendations(
  commitDecline: number,
  concentration: number,
  issueDelays: number,
  prBacklog: number,
  inactivity: number,
  dependencyRisk: 'Low' | 'Medium' | 'High',
  busFactor: number
): BurnoutRecommendation[] {
  const recs: BurnoutRecommendation[] = [];

  if (concentration > 50) {
    recs.push({
      icon: 'Users',
      title: 'Distribute Responsibilities',
      description:
        'The top contributor owns a large share of commits. Spread knowledge and ownership across the team to reduce single-point-of-failure risk.',
    });
  }

  if (busFactor <= 2 || dependencyRisk === 'High') {
    recs.push({
      icon: 'UserPlus',
      title: 'Add Maintainers',
      description:
        'The bus factor is critically low. Onboard new maintainers and pair-program on key subsystems to build redundancy.',
    });
  }

  if (commitDecline > 40) {
    recs.push({
      icon: 'TrendingDown',
      title: 'Improve Contributor Onboarding',
      description:
        'Commit activity is declining. Streamline contributor onboarding with better "good first issue" labels, setup guides, and mentoring.',
    });
  }

  if (prBacklog > 50) {
    recs.push({
      icon: 'GitPullRequest',
      title: 'Reduce Review Bottlenecks',
      description:
        'Pull request reviews may be piling up. Add dedicated review rotations and automate CI checks to accelerate merge velocity.',
    });
  }

  if (issueDelays > 50) {
    recs.push({
      icon: 'BookOpen',
      title: 'Improve Documentation',
      description:
        'Repository health indicates slower issue handling. Invest in better docs, FAQs, and self-serve resources to reduce maintainer load.',
    });
  }

  if (inactivity > 30) {
    recs.push({
      icon: 'MessageCircle',
      title: 'Increase Community Engagement',
      description:
        'Contributors are going silent. Reach out proactively, run contributor sprints, and recognise contributions to retain active members.',
    });
  }

  // Always ensure at least one recommendation
  if (recs.length === 0) {
    recs.push({
      icon: 'CheckCircle',
      title: 'Maintain Healthy Practices',
      description:
        'This repository shows healthy contributor patterns. Continue with regular code reviews, documentation updates, and balanced workloads.',
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

export function calculateBurnoutRisk(input: BurnoutRiskInput): BurnoutRiskResult {
  const commitDecline = measureCommitDecline(input.contributors);
  const concentration = measureConcentration(input.contributors);
  const issueDelays = measureIssueDelays(input.sustainabilityScore);
  const prBacklog = measurePRBacklog(input.dependencyRisk);
  const inactivity = measureInactivity(input.inactivityAlerts);

  const rawScore =
    commitDecline * WEIGHT_COMMIT_DECLINE +
    concentration * WEIGHT_CONCENTRATION +
    issueDelays * WEIGHT_ISSUE_DELAYS +
    prBacklog * WEIGHT_PR_BACKLOG +
    inactivity * WEIGHT_INACTIVITY;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  const level: BurnoutRiskResult['level'] = score <= 30 ? 'Low' : score <= 70 ? 'Moderate' : 'High';

  const description =
    level === 'Low'
      ? 'Low Risk — Healthy contributor activity'
      : level === 'Moderate'
        ? 'Moderate Risk — Monitor workload distribution'
        : 'High Risk — Burnout indicators detected';

  const recommendations = generateRecommendations(
    commitDecline,
    concentration,
    issueDelays,
    prBacklog,
    inactivity,
    input.dependencyRisk,
    input.busFactor
  );

  return { score, level, description, recommendations };
}
