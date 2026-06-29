import type { ContributionCalendar, BadgeTheme } from './index';

export interface TeamMember {
  username: string;
  avatarUrl: string;
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  lastContributionDate: string;
}

export interface TeamMetrics {
  totalMembers: number;
  combinedContributions: number;
  combinedCurrentStreak: number;
  combinedLongestStreak: number;
  averageDailyContributions: number;
  activeMembers: number;
}

export interface SprintProgress {
  name: string;
  startDate: string;
  endDate: string;
  targetContributions: number;
  currentContributions: number;
  progressPercentage: number;
}

export interface VelocityTrend {
  week: string;
  contributions: number;
  velocityScore: number;
}

export interface BurnoutRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  indicators: string[];
  recommendations: string[];
}

export interface TeamHealthData {
  teamId: string;
  teamName: string;
  members: TeamMember[];
  metrics: TeamMetrics;
  sprintProgress: SprintProgress[];
  velocityTrends: VelocityTrend[];
  burnoutRisk: BurnoutRisk;
  contributionCalendar: ContributionCalendar;
  generatedAt: string;
}

export interface EnterpriseTheme extends BadgeTheme {
  executive: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
  };
}

export type HealthScoreLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface TeamHealthScore {
  overall: number;
  productivity: number;
  sustainability: number;
  collaboration: number;
  level: HealthScoreLevel;
}
