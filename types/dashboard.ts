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

export interface HallOfFameAward {
  category: 'active' | 'growing' | 'collaborative' | 'popular' | 'contributed';
  title: string;
  repoName: string;
  repoAvatar?: string;
  description: string;

  centerpieceLabel: string;
  centerpieceValue: string | number;
  bottomStats: string;

  explanation: string;
  icon: string;
  url: string;
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
  calendar: ContributionCalendar;
}

export interface OrgDashboardData {
  profile: UserProfile;
  stats: UserStats;
  calendar: ContributionCalendar;
}

export interface Repository {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  url: string;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
}
