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
 * CONTRIBUTION FORECAST TYPES
 * ========================================================================== */

export interface ForecastDay {
  /** Calendar date (YYYY-MM-DD) */
  date: string;
  /** Short weekday label e.g. "Mon" */
  dayLabel: string;
  /** Predicted contribution count (rounded to nearest integer) */
  predicted: number;
}

export interface ForecastData {
  /** Next 7 calendar days with per-day predicted contribution counts */
  next7Days: ForecastDay[];
  /** Projected total contributions by end of the current month */
  endOfMonthProjection: number;
  /** Projected total contributions by end of the current calendar year */
  yearEndProjection: number;
  /** Rolling 30-day daily average used as the trend baseline */
  dailyAverage: number;
  /** Current month's contribution count so far */
  currentMonthActual: number;
  /** Remaining days in the current month (including today) */
  daysLeftInMonth: number;
  /** Total contributions this calendar year so far */
  yearToDateActual: number;
}
