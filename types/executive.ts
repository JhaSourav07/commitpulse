export interface ExecutiveMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface TeamCapacity {
  teamId: string;
  teamName: string;
  members: number;
  velocity: number;
  capacity: number;
  utilizationPercent: number;
}

export interface StrategicInitiative {
  id: string;
  name: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  startDate: string;
  targetDate: string;
  health: number;
  owner: string;
}

export interface EngineeringHealth {
  overallScore: number;
  productivityScore: number;
  qualityScore: number;
  sustainabilityScore: number;
  velocityScore: number;
}

export interface DeploymentMetrics {
  frequency: number;
  leadTime: number;
  changeFailureRate: number;
  meanTimeToRestore: number;
}

export interface BusinessOutcome {
  id: string;
  metric: string;
  value: number;
  target: number;
  correlation: number;
}

export interface ExecutiveReport {
  id: string;
  title: string;
  generatedAt: string;
  period: { start: string; end: string };
  engineeringHealth: EngineeringHealth;
  metrics: ExecutiveMetric[];
  teamCapacity: TeamCapacity[];
  initiatives: StrategicInitiative[];
  deploymentMetrics: DeploymentMetrics;
  businessOutcomes: BusinessOutcome[];
  naturalLanguageSummary: string;
}

export interface ExecutiveDashboardData {
  currentReport: ExecutiveReport;
  historicalTrends: { date: string; healthScore: number; velocity: number }[];
  comparisons: { period: string; current: number; previous: number }[];
  alerts: {
    id: string;
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }[];
}

export interface ExecutiveFilter {
  period?: 'week' | 'month' | 'quarter' | 'year';
  teams?: string[];
  dateRange?: { start: string; end: string };
}
