export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
}

export interface BadgeTheme {
  bg: string;
  text: string;
  accent: string;
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface BadgeParams {
  user: string;
  theme?: string;
  bg?: string;
  text?: string;
  accent?: string;
  radius?: string;
  speed?: string;
  scale?: 'linear' | 'log';
}
