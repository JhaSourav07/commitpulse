export interface RepositoryData {
  name: string;
  commits?: number;
  commitCount?: number;
  stars?: number;
  stargazerCount?: number;
  forks?: number;
  forkCount?: number;
  createdAt?: string | Date;
  created_at?: string | Date;
  language?: { name: string; color: string } | string | null;
  primaryLanguage?: { name: string; color: string } | string | null;
  url?: string;
  linesAdded?: number;
  linesDeleted?: number;
  pullRequestCount?: number;
  isPrivate?: boolean;
}

export interface ActivityData {
  totalCommits?: number;
  linesOfCode?: number;
  pullRequests?: number;
  reviews?: number;
  streakDays?: number;
}

export interface RealWorldImpactMetrics {
  impactScore: number; // 0 - 100
  tier: 'Architect' | 'Lead Innovator' | 'Senior Specialist' | 'Active Builder' | 'Contributor';
  hoursSaved: number;
  developerValueDollars: number;
  problemSolvingDepth: number; // 0 - 100 percentage
  architecturalWeight: number; // 0 - 100 percentage
  featureVelocity: number; // commits/week or feature output rate
  featureVsRefactorRatio: {
    features: number;
    refactors: number;
    bugFixes: number;
  };
  topLanguages: Array<{ name: string; percentage: number; color: string }>;
  recruiterSummary: {
    oneLiner: string;
    bulletPoints: string[];
  };
}

export function calculateRealWorldImpact(
  repos: RepositoryData[] = [],
  activity: ActivityData = {}
): RealWorldImpactMetrics {
  if (!repos || repos.length === 0) {
    return {
      impactScore: 0,
      tier: 'Contributor',
      hoursSaved: 0,
      developerValueDollars: 0,
      problemSolvingDepth: 0,
      architecturalWeight: 0,
      featureVelocity: 0,
      featureVsRefactorRatio: { features: 0, refactors: 0, bugFixes: 0 },
      topLanguages: [],
      recruiterSummary: {
        oneLiner: 'No repository activity recorded yet.',
        bulletPoints: ['Connect repositories to analyze engineering value.'],
      },
    };
  }

  let totalCommits = activity.totalCommits ?? 0;
  let totalStars = 0;
  let totalForks = 0;
  let totalLinesAdded = 0;
  let totalLinesDeleted = 0;
  let totalPRs = activity.pullRequests ?? 0;

  const langMap: Record<string, { commits: number; color: string }> = {};

  repos.forEach((repo) => {
    const c = repo.commits ?? repo.commitCount ?? 0;
    const s = repo.stars ?? repo.stargazerCount ?? 0;
    const f = repo.forks ?? repo.forkCount ?? 0;
    const pr = repo.pullRequestCount ?? 0;

    totalCommits += c;
    totalStars += s;
    totalForks += f;
    totalPRs += pr;
    totalLinesAdded += repo.linesAdded ?? c * 85;
    totalLinesDeleted += repo.linesDeleted ?? c * 35;

    let langName = 'Other';
    let langColor = '#94a3b8';

    const langObj = repo.primaryLanguage ?? repo.language;
    if (langObj) {
      if (typeof langObj === 'object') {
        langName = langObj.name ?? 'Other';
        langColor = langObj.color ?? '#94a3b8';
      } else if (typeof langObj === 'string') {
        langName = langObj;
      }
    }

    if (!langMap[langName]) {
      langMap[langName] = { commits: 0, color: langColor };
    }
    langMap[langName].commits += Math.max(1, c);
  });

  const grandCommitCount = Math.max(1, totalCommits);

  // Calculate language distribution
  const topLanguages = Object.entries(langMap)
    .map(([name, val]) => ({
      name,
      percentage: parseFloat(((val.commits / grandCommitCount) * 100).toFixed(1)),
      color: val.color,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Impact Score (0 - 100)
  // Weighted: commits (30%), stars (25%), forks (25%), PRs (20%)
  const commitScore = Math.min(30, (totalCommits / 200) * 30);
  const starScore = Math.min(25, (totalStars / 50) * 25);
  const forkScore = Math.min(25, (totalForks / 20) * 25);
  const prScore = Math.min(20, (totalPRs / 30) * 20);

  const rawImpactScore = Math.round(commitScore + starScore + forkScore + prScore);
  const impactScore = Math.max(5, Math.min(100, rawImpactScore));

  // Determine Tier
  let tier: RealWorldImpactMetrics['tier'] = 'Contributor';
  if (impactScore >= 85) tier = 'Architect';
  else if (impactScore >= 70) tier = 'Lead Innovator';
  else if (impactScore >= 50) tier = 'Senior Specialist';
  else if (impactScore >= 30) tier = 'Active Builder';

  // Hours saved = ~ 1.5 hours per commit + ~3 hours per PR + star validation weight
  const hoursSaved = Math.round(totalCommits * 1.8 + totalPRs * 3.5 + totalStars * 0.5);

  // Value in dollars based on $65/hr developer rate average
  const developerValueDollars = Math.round(hoursSaved * 65);

  // Problem Solving Depth (complexity score based on churn & lines ratio)
  const locTotal = totalLinesAdded + totalLinesDeleted;
  const churnRatio = locTotal > 0 ? totalLinesDeleted / locTotal : 0.3;
  const depthRaw = Math.round((1 - Math.abs(0.3 - churnRatio)) * 70 + Math.min(30, totalPRs * 2));
  const problemSolvingDepth = Math.max(15, Math.min(98, depthRaw));

  // Architectural Weight (balance of system repos, core languages, forks)
  const archRaw = Math.round(
    (topLanguages.length / 5) * 40 + Math.min(35, totalStars * 1.5) + Math.min(25, totalForks * 2)
  );
  const architecturalWeight = Math.max(10, Math.min(99, archRaw));

  // Feature Velocity (commits & PRs per week assuming active year)
  const featureVelocity = parseFloat(((totalCommits + totalPRs * 2) / 52).toFixed(1));

  // Ratio split
  const features = Math.round(totalCommits * 0.55);
  const refactors = Math.round(totalCommits * 0.3);
  const bugFixes = Math.max(0, totalCommits - features - refactors);

  // Recruiter Pitch
  const primaryLang = topLanguages[0]?.name ?? 'Software';
  const recruiterSummary = {
    oneLiner: `${tier} specializing in ${primaryLang} with ~${hoursSaved} hrs of engineering output ($${developerValueDollars.toLocaleString()} value delivered).`,
    bulletPoints: [
      `Delivered ${totalCommits} commits across ${repos.length} core repository project(s).`,
      `Maintained a ${problemSolvingDepth}% Problem-Solving Depth & ${architecturalWeight}% Architectural Impact rating.`,
      `Engaged in ${totalPRs} pull request review workflows with an average feature velocity of ${featureVelocity} deliverables/wk.`,
    ],
  };

  return {
    impactScore,
    tier,
    hoursSaved,
    developerValueDollars,
    problemSolvingDepth,
    architecturalWeight,
    featureVelocity,
    featureVsRefactorRatio: {
      features,
      refactors,
      bugFixes,
    },
    topLanguages,
    recruiterSummary,
  };
}
