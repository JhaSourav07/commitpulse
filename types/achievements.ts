export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type AchievementCategory =
  | 'contribution'
  | 'pull-request'
  | 'repository'
  | 'collaboration'
  | 'technology';

export interface AchievementLevelDef {
  tier: AchievementTier;
  threshold: number;
  xp: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  rarity: AchievementRarity;
  levels: AchievementLevelDef[];
  measureLabel: string;
}

export interface AchievementState {
  currentValue: number;
  targetValue: number;
  progress: number;
  unlocked: boolean;
  currentTier: AchievementTier | null;
  currentTierIndex: number;
  nextTier: AchievementLevelDef | null;
  xpEarned: number;
  unlockedAt: string | null;
}

export interface AchievementData {
  def: AchievementDef;
  state: AchievementState;
}

export interface AchievementsResponse {
  username: string;
  profile: {
    avatarUrl: string;
    name: string;
    login: string;
  };
  overview: {
    totalAchievements: number;
    unlockedCount: number;
    completionPercent: number;
    totalXp: number;
    developerLevel: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    levelProgress: number;
  };
  categories: {
    category: AchievementCategory;
    label: string;
    icon: string;
    achievements: AchievementData[];
    unlockedCount: number;
    totalCount: number;
  }[];
  recentUnlocks: AchievementData[];
  nextAchievement: AchievementData | null;
}

export const ACHIEVEMENT_RARITY_COLORS: Record<
  AchievementRarity,
  { bg: string; border: string; glow: string; text: string }
> = {
  common: {
    bg: 'rgba(148,163,184,0.10)',
    border: 'rgba(148,163,184,0.3)',
    glow: 'rgba(148,163,184,0.2)',
    text: '#94a3b8',
  },
  uncommon: {
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.3)',
    glow: 'rgba(34,197,94,0.2)',
    text: '#22c55e',
  },
  rare: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.3)',
    glow: 'rgba(59,130,246,0.2)',
    text: '#3b82f6',
  },
  epic: {
    bg: 'rgba(168,85,247,0.10)',
    border: 'rgba(168,85,247,0.3)',
    glow: 'rgba(168,85,247,0.2)',
    text: '#a855f7',
  },
  legendary: {
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.3)',
    glow: 'rgba(249,115,22,0.2)',
    text: '#f97316',
  },
  mythic: {
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.2)',
    text: '#ef4444',
  },
};

export const ACHIEVEMENT_TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'var(--tier-bronze-rgb)',
  silver: 'var(--tier-silver-rgb)',
  gold: 'var(--tier-gold-rgb)',
  platinum: 'var(--tier-platinum-rgb)',
  diamond: 'var(--tier-diamond-rgb)',
};

export const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string }> = {
  contribution: { label: 'Contribution', icon: '🔥' },
  'pull-request': { label: 'Pull Requests', icon: '🚀' },
  repository: { label: 'Repository', icon: '⭐' },
  collaboration: { label: 'Collaboration', icon: '🤝' },
  technology: { label: 'Technology', icon: '🧠' },
};
