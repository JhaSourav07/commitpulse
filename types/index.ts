export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
  todayDate: string; // local calendar date used as "today" (YYYY-MM-DD)
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

export interface MonthlyStats {
  currentMonthTotal: number;
  previousMonthTotal: number;
  deltaPercentage: number;
  deltaAbsolute: number;
  currentMonthName: string;
}

export interface BadgeParams {
  user: string;
  bg: string;
  text: string;
  accent: string;
  speed: string;
  scale: 'linear' | 'log';
  font?: string;
  radius?: number;
  autoTheme?: boolean;
  hide_title?: boolean;
  hideBackground?: boolean;
  hide_stats?: boolean;
  lang?: string;
  view?: 'default' | 'monthly';
  delta_format?: 'percent' | 'absolute' | 'both';
  width?: number;
  height?: number;
  size?: 'small' | 'medium' | 'large';
}
