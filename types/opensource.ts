export interface Contributor {
  id: string;
  username: string;
  avatarUrl: string;
  commits: number;
  pullRequests: number;
  issues: number;
  isMaintainer: boolean;
  joinedDate: string;
  lastActiveDate: string;
}

export interface ContributorRetention {
  period: string;
  retainedContributors: number;
  newContributors: number;
  churnedContributors: number;
  retentionRate: number;
}

export interface IssueResponseMetrics {
  averageFirstResponseTime: number;
  averageResolutionTime: number;
  openIssues: number;
  closedIssues: number;
  issuesByPriority: { priority: string; count: number }[];
  responseTrend: { date: string; avgResponseTime: number }[];
}

export interface ReleaseMetrics {
  totalReleases: number;
  releasesByMonth: { month: string; count: number; version: string }[];
  averageReleaseInterval: number;
  latestRelease: { version: string; date: string; changes: number };
}

export interface CommunityGrowth {
  totalContributors: number;
  contributorsByMonth: { month: string; count: number; cumulative: number }[];
  contributorDiversity: number;
  activeContributorsLastMonth: number;
  returningContributors: number;
}

export interface MaintainerWorkload {
  maintainer: string;
  issuesAssigned: number;
  pullRequestsAssigned: number;
  averageResponseTime: number;
  workloadScore: number;
}

export interface SustainabilityScore {
  overall: number;
  contributorHealth: number;
  issueManagement: number;
  releaseHealth: number;
  communityEngagement: number;
  riskIndicators: string[];
}

export interface OSSProjectHealth {
  projectId: string;
  projectName: string;
  healthScore: SustainabilityScore;
  contributors: Contributor[];
  retention: ContributorRetention[];
  issueMetrics: IssueResponseMetrics;
  releaseMetrics: ReleaseMetrics;
  communityGrowth: CommunityGrowth;
  maintainerWorkload: MaintainerWorkload[];
  trends: { date: string; healthScore: number }[];
  benchmarks: { category: string; projectValue: number; ecosystemAverage: number }[];
}

export interface OSSFilter {
  projectId?: string;
  language?: string;
  category?: string;
  dateRange?: { start: string; end: string };
}
