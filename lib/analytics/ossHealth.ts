import type {
  Contributor,
  ContributorRetention,
  IssueResponseMetrics,
  ReleaseMetrics,
  CommunityGrowth,
  MaintainerWorkload,
  SustainabilityScore,
  OSSProjectHealth,
  OSSFilter,
} from '@/types/opensource';

function generateContributors(count: number): Contributor[] {
  const names = [
    'alice',
    'bob',
    'charlie',
    'diana',
    'eve',
    'frank',
    'grace',
    'henry',
    'iris',
    'jack',
    'kate',
    'leo',
  ];
  return names.slice(0, Math.min(count, 12)).map((name, i) => ({
    id: `user-${i + 1}`,
    username: name,
    avatarUrl: `https://avatars.githubusercontent.com/u/${1000 + i}`,
    commits: Math.floor(Math.random() * 500) + 20,
    pullRequests: Math.floor(Math.random() * 50) + 5,
    issues: Math.floor(Math.random() * 30) + 1,
    isMaintainer: i < 2,
    joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function generateRetentionMetrics(): ContributorRetention[] {
  const data: ContributorRetention[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const base = 50 + Math.floor(Math.random() * 30);
    data.push({
      period: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      retainedContributors: base,
      newContributors: Math.floor(Math.random() * 15) + 5,
      churnedContributors: Math.floor(Math.random() * 10),
      retentionRate: 70 + Math.floor(Math.random() * 25),
    });
  }
  return data;
}

function generateIssueMetrics(): IssueResponseMetrics {
  const priorities = ['critical', 'high', 'medium', 'low'];
  return {
    averageFirstResponseTime: Math.floor(Math.random() * 48) + 4,
    averageResolutionTime: Math.floor(Math.random() * 168) + 24,
    openIssues: Math.floor(Math.random() * 100) + 20,
    closedIssues: Math.floor(Math.random() * 500) + 100,
    issuesByPriority: priorities.map((p) => ({
      priority: p,
      count: Math.floor(Math.random() * 50) + 5,
    })),
    responseTrend: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      avgResponseTime: Math.floor(Math.random() * 20) + 10,
    })),
  };
}

function generateReleaseMetrics(): ReleaseMetrics {
  const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0', '2.1.0', '2.2.0', '3.0.0'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return {
    totalReleases: 24,
    releasesByMonth: months.slice(0, 6).map((month, i) => ({
      month,
      count: Math.floor(Math.random() * 3) + 1,
      version: versions[i],
    })),
    averageReleaseInterval: 14 + Math.floor(Math.random() * 10),
    latestRelease: { version: '3.0.0', date: new Date().toISOString().split('T')[0], changes: 25 },
  };
}

function generateCommunityGrowth(): CommunityGrowth {
  return {
    totalContributors: 156,
    contributorsByMonth: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        'en-US',
        { month: 'short' }
      ),
      count: Math.floor(Math.random() * 15) + 5,
      cumulative: 50 + i * 10 + Math.floor(Math.random() * 20),
    })),
    contributorDiversity: 72 + Math.floor(Math.random() * 20),
    activeContributorsLastMonth: 45,
    returningContributors: 38,
  };
}

function generateMaintainerWorkload(contributors: Contributor[]): MaintainerWorkload[] {
  const maintainers = contributors.filter((c) => c.isMaintainer);
  return maintainers.map((m) => ({
    maintainer: m.username,
    issuesAssigned: Math.floor(Math.random() * 50) + 10,
    pullRequestsAssigned: Math.floor(Math.random() * 20) + 5,
    averageResponseTime: Math.floor(Math.random() * 12) + 2,
    workloadScore: Math.floor(Math.random() * 40) + 50,
  }));
}

function calculateSustainabilityScore(
  contributors: Contributor[],
  issueMetrics: IssueResponseMetrics
): SustainabilityScore {
  const contributorHealth = Math.floor(Math.random() * 20) + 70;
  const issueManagement =
    issueMetrics.openIssues < 50 ? 80 : issueMetrics.openIssues < 100 ? 65 : 50;
  const releaseHealth = Math.floor(Math.random() * 15) + 75;
  const communityEngagement = Math.floor(Math.random() * 20) + 65;

  const overall = Math.round(
    (contributorHealth + issueManagement + releaseHealth + communityEngagement) / 4
  );

  return {
    overall,
    contributorHealth,
    issueManagement,
    releaseHealth,
    communityEngagement,
    riskIndicators: overall < 70 ? ['Low contributor retention', 'High issue backlog'] : [],
  };
}

export function analyzeOSSHealth(
  projectId: string,
  projectName: string,
  filter?: OSSFilter
): OSSProjectHealth {
  const contributors = generateContributors(10);
  const retention = generateRetentionMetrics();
  const issueMetrics = generateIssueMetrics();
  const releaseMetrics = generateReleaseMetrics();
  const communityGrowth = generateCommunityGrowth();
  const maintainerWorkload = generateMaintainerWorkload(contributors);
  const healthScore = calculateSustainabilityScore(contributors, issueMetrics);

  const trends = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    healthScore: healthScore.overall + Math.floor(Math.random() * 10) - 5,
  }));

  const benchmarks = [
    {
      category: 'Contributor Growth',
      projectValue: communityGrowth.contributorDiversity,
      ecosystemAverage: 65,
    },
    {
      category: 'Issue Resolution',
      projectValue: 100 - issueMetrics.averageResolutionTime / 5,
      ecosystemAverage: 70,
    },
    {
      category: 'Release Frequency',
      projectValue: releaseMetrics.averageReleaseInterval < 21 ? 85 : 60,
      ecosystemAverage: 55,
    },
  ];

  return {
    projectId,
    projectName,
    healthScore,
    contributors,
    retention,
    issueMetrics,
    releaseMetrics,
    communityGrowth,
    maintainerWorkload,
    trends,
    benchmarks,
  };
}
