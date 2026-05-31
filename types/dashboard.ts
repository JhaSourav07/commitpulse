// types/dashboard.ts

import type { ContributionCalendar } from './index';

export interface UserProfile {
  username: string;
  name: string;
  avatarUrl: string;
  isPro: boolean;
  bio: string;
  location: string;
  joinedDate: string;
  developerScore: number;
  type?: 'User' | 'Organization'; // Added to distinguish orgs from standard users
  stats: {
    repositories: number;
    followers: number;
    following: number; // For Organizations, this acts as the "members" count
    stars: number;
  };
}

export interface ActivityData {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 4 = highest

  // Added for LoC (Lines of Code) Mode tracking
  locAdditions?: number;
  locDeletions?: number;
}

export interface UserStats {
  currentStreak: number;
  peakStreak: number;
  totalContributions: number;
}

export interface LanguageData {
  name: string;
  color: string;
  percentage: number;
}

export interface AIInsight {
  id: string;
  icon: string;
  text: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;

  type: 'contributions' | 'streak' | 'behavior';
  threshold: number;
  currentValue: number;
  progress: number; // 0–100
}

export interface CommitClockData {
  day: string; // 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
  commits: number;
}

export interface DashboardExportData {
  stats: UserStats;
  languages: LanguageData[];
  activity?: ActivityData[];
}

/* ==========================================================================
 * NEW EPIC FEATURE TYPES (Wrapped & Org Data)
 * ========================================================================== */

export interface WrappedStats {
  totalContributions: number;
  mostActiveDate: string;
  highestDailyCount: number;
  busiestMonth: string;
  weekendRatio: number;
  topLanguage: string;
}

export interface OrgDashboardData {
  profile: UserProfile;
  stats: UserStats;
  calendar: ContributionCalendar;
}

/* ==========================================================================
 * AI GROWTH INSIGHTS & ROADMAP TYPES
 * ========================================================================== */

export interface GrowthScoreBreakdown {
  frequencyScore: number;
  consistencyScore: number;
  volumeScore: number;
  qualityScore: number;
}

export interface GrowthTrend {
  period: string;
  text: string;
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface ConsistencyAnalysis {
  activeDaysRatio: number;
  longestActiveGap: number;
  longestStreak: number;
  description: string;
}

export interface ProductivitySpike {
  date: string;
  count: number;
  description: string;
}

export interface RecommendedDomain {
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  suggestedRepos: { name: string; url: string; description: string }[];
}

export interface SkillInsights {
  primaryLanguage: string;
  detectedTechs: string[];
  strongestAreas: string[];
  recommendedDomains: RecommendedDomain[];
}

export interface RoadmapGoal {
  id: string;
  title: string;
  target: string;
  progress: number;
  completed: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  requirement: string;
  unlocked: boolean;
  icon: string;
  badgeName?: string;
}

export interface PersonalizedRoadmap {
  shortTermGoals: RoadmapGoal[];
  longTermGoals: RoadmapGoal[];
  milestones: RoadmapMilestone[];
}

export interface CategoryRating {
  category: 'Bug Fixes' | 'Features' | 'Documentation' | 'Testing' | 'Refactoring';
  score: number;
  description: string;
}

export interface AIRecommendations {
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  difficultyReason: string;
  categoryRatings: CategoryRating[];
  improvementSuggestions: string[];
}

export interface MonthlyProgressSummary {
  month: string;
  contributions: number;
  summary: string;
}

export interface GrowthAnalysisResult {
  growthScore: number;
  growthScoreBreakdown: GrowthScoreBreakdown;
  growthTrend: GrowthTrend;
  consistencyAnalysis: ConsistencyAnalysis;
  productivitySpikes: ProductivitySpike[];
  skillInsights: SkillInsights;
  personalizedRoadmap: PersonalizedRoadmap;
  aiRecommendations: AIRecommendations;
  monthlyProgressSummaries: MonthlyProgressSummary[];
}
