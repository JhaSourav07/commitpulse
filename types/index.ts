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

export interface BadgeParams {
  user: string;
  theme?: string;
  bg?: string;
  text?: string;
  accent?: string;
  radius?: string;
}