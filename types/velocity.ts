// types/velocity.ts
// Engineering Velocity Intelligence types

export interface VelocityKPI {
  commitsPerWeek: number;
  prsPerWeek: number;
  reviewsPerWeek: number;
  issuesClosedPerWeek: number;
  avgCycleTime: number; // in hours
  velocityTrend: number; // percentage change
}

export interface VelocityData {
  kpis: VelocityKPI;
  trendData: TrendDataPoint[];
  sprintMetrics: SprintMetrics;
  productivityInsights: ProductivityInsight[];
}

export interface TrendDataPoint {
  week: string;
  commits: number;
  prs: number;
  reviews: number;
  issues: number;
  velocity: number;
}

export interface SprintMetrics {
  currentSprint: string;
  commits: number;
  prsMerged: number;
  reviewsCompleted: number;
  issuesClosed: number;
  velocity: number;
  previousVelocity: number;
}

export interface ProductivityInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  metric: string;
  change: number;
}

export interface VelocityQueryParams {
  username?: string;
  org?: string;
  repo?: string;
  weeks?: number;
  sprintLength?: number;
}
