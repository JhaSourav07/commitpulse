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
  bg: string;
  text: string;
  accent: string;
  speed: string;
  scale: 'linear' | 'log';
  font?: string;
  radius?: string;
}
