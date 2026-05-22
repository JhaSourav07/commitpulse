export interface UserProfile {
  username: string;
  name: string;
  avatarUrl: string;
  isPro: boolean;
  bio: string;
  location: string;
  joinedDate: string;
  developerScore: number;
  stats: {
    repositories: number;
    followers: number;
    following: number;
    stars: number;
  };
}

export interface ActivityData {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 4 = highest
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

  type?: 'contributions' | 'streak';
  threshold?: number;
  currentValue?: number;
  progress?: number;
}

export interface CommitClockData {
  day: string; // 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'
  commits: number;
}

export interface DashboardExportData {
  stats: UserStats;
  languages: LanguageData[];
}
