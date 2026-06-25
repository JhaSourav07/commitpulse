// types/productivity.ts
// Developer Productivity Intelligence types

export interface DeveloperKPI {
  totalCommits: number;
  totalPRs: number;
  totalReviews: number;
  totalDiscussions: number;
  avgResponseTime: number;
  productivityScore: number;
}

export interface ProductivityData {
  kpis: DeveloperKPI;
  weeklyTrends: WeeklyTrend[];
  contributionQuality: QualityMetrics;
  activityTimeline: ActivityEvent[];
}

export interface WeeklyTrend {
  week: string;
  commits: number;
  prs: number;
  reviews: number;
  discussions: number;
}

export interface QualityMetrics {
  codeReviewQuality: number;
  testCoverage: number;
  documentationScore: number;
  overallQuality: number;
}

export interface ActivityEvent {
  id: string;
  type: 'commit' | 'pr' | 'review' | 'discussion';
  timestamp: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}
