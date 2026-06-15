export interface CIWorkflowRun {
  id: number;
  name: string;
  repository: string;
  branch: string;
  status: string;
  conclusion: string | null;
  duration: number;
  triggerEvent: string;
  startedAt: string;
  finishedAt: string | null;
  url: string;
}

export interface CIWorkflow {
  id: number;
  name: string;
  repository: string;
  state: string;
}

export interface CIRepoHealth {
  name: string;
  successRate: number;
  totalRuns: number;
  avgDuration: number;
  lastRunStatus: string;
}

export interface CIInsights {
  fastestWorkflow: string;
  fastestDuration: number;
  slowestWorkflow: string;
  slowestDuration: number;
  mostActiveRepo: string;
  mostActiveRepoRuns: number;
  mostFailedWorkflow: string;
  mostFailedCount: number;
  highestSuccessRepo: string;
  highestSuccessRate: number;
}

export interface CIDailyTrend {
  date: string;
  runs: number;
}

export interface CIWeeklyTrend {
  week: string;
  runs: number;
}

export interface CIMonthlyTrend {
  month: string;
  runs: number;
}

export interface CIAnalyticsData {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  successRate: number;
  avgBuildDuration: number;

  statusBreakdown: {
    success: number;
    failed: number;
    cancelled: number;
    inProgress: number;
  };

  dailyTrend: CIDailyTrend[];
  weeklyTrend: CIWeeklyTrend[];
  monthlyTrend: CIMonthlyTrend[];

  recentRuns: CIWorkflowRun[];
  repoHealth: CIRepoHealth[];
  insights: CIInsights;

  workflows: CIWorkflow[];
  repos: string[];
  branches: string[];
}

export interface CIAnalyticsFilters {
  repository: string;
  branch: string;
  workflow: string;
  timeRange: string;
  status: string;
}
