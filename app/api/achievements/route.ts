import { NextResponse } from 'next/server';
import { validateGitHubUsername } from '@/lib/validations';
import { getFullDashboardData } from '@/lib/github';
import type {
  AchievementDef,
  AchievementCategory,
  AchievementState,
  AchievementData,
  AchievementsResponse,
} from '@/types/achievements';
import { getUserGitHubToken } from '@/lib/githubtoken';
import { getClientIp } from '@/utils/getClientIp';
import { RateLimiter } from '@/lib/rate-limit';

const achievementsLimiter = new RateLimiter(10, 60_000, 1);

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // 🔥 Contribution
  {
    id: 'commit-champion',
    name: 'Commit Champion',
    description: 'Make commits to unlock higher tiers',
    category: 'contribution',
    icon: '🔥',
    rarity: 'common',
    measureLabel: 'commits',
    levels: [
      { tier: 'bronze', threshold: 100, xp: 50 },
      { tier: 'silver', threshold: 500, xp: 100 },
      { tier: 'gold', threshold: 1000, xp: 200 },
      { tier: 'platinum', threshold: 5000, xp: 500 },
      { tier: 'diamond', threshold: 10000, xp: 1000 },
    ],
  },
  {
    id: 'consistency-master',
    name: 'Consistency Master',
    description: 'Maintain a long contribution streak',
    category: 'contribution',
    icon: '📅',
    rarity: 'rare',
    measureLabel: 'day streak',
    levels: [
      { tier: 'bronze', threshold: 7, xp: 50 },
      { tier: 'silver', threshold: 30, xp: 150 },
      { tier: 'gold', threshold: 100, xp: 300 },
      { tier: 'platinum', threshold: 200, xp: 600 },
      { tier: 'diamond', threshold: 365, xp: 1200 },
    ],
  },
  {
    id: 'daily-contributor',
    name: 'Daily Contributor',
    description: 'Contribute on many unique days',
    category: 'contribution',
    icon: '☀️',
    rarity: 'uncommon',
    measureLabel: 'active days',
    levels: [
      { tier: 'bronze', threshold: 30, xp: 50 },
      { tier: 'silver', threshold: 100, xp: 100 },
      { tier: 'gold', threshold: 200, xp: 200 },
      { tier: 'platinum', threshold: 300, xp: 400 },
      { tier: 'diamond', threshold: 365, xp: 800 },
    ],
  },
  {
    id: 'marathon-coder',
    name: 'Marathon Coder',
    description: 'Accumulate a massive total of contributions',
    category: 'contribution',
    icon: '🏃',
    rarity: 'epic',
    measureLabel: 'total contributions',
    levels: [
      { tier: 'bronze', threshold: 1000, xp: 100 },
      { tier: 'silver', threshold: 5000, xp: 250 },
      { tier: 'gold', threshold: 10000, xp: 500 },
      { tier: 'platinum', threshold: 25000, xp: 1000 },
      { tier: 'diamond', threshold: 50000, xp: 2000 },
    ],
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Contribute on weekends',
    category: 'contribution',
    icon: '🎮',
    rarity: 'uncommon',
    measureLabel: 'weekend contributions',
    levels: [
      { tier: 'bronze', threshold: 10, xp: 30 },
      { tier: 'silver', threshold: 50, xp: 80 },
      { tier: 'gold', threshold: 200, xp: 180 },
      { tier: 'platinum', threshold: 500, xp: 350 },
      { tier: 'diamond', threshold: 1000, xp: 700 },
    ],
  },

  // 🚀 Pull Requests
  {
    id: 'pr-rookie',
    name: 'PR Rookie',
    description: 'Open pull requests',
    category: 'pull-request',
    icon: '🎯',
    rarity: 'common',
    measureLabel: 'PRs',
    levels: [
      { tier: 'bronze', threshold: 5, xp: 30 },
      { tier: 'silver', threshold: 25, xp: 80 },
      { tier: 'gold', threshold: 50, xp: 150 },
      { tier: 'platinum', threshold: 100, xp: 300 },
      { tier: 'diamond', threshold: 250, xp: 600 },
    ],
  },
  {
    id: 'pr-master',
    name: 'PR Master',
    description: 'Open a high number of pull requests',
    category: 'pull-request',
    icon: '🚀',
    rarity: 'rare',
    measureLabel: 'PRs',
    levels: [
      { tier: 'bronze', threshold: 50, xp: 80 },
      { tier: 'silver', threshold: 150, xp: 200 },
      { tier: 'gold', threshold: 300, xp: 400 },
      { tier: 'platinum', threshold: 500, xp: 800 },
      { tier: 'diamond', threshold: 1000, xp: 1500 },
    ],
  },
  {
    id: 'merge-master',
    name: 'Merge Master',
    description: 'Get pull requests merged',
    category: 'pull-request',
    icon: '🔀',
    rarity: 'epic',
    measureLabel: 'merged PRs',
    levels: [
      { tier: 'bronze', threshold: 10, xp: 50 },
      { tier: 'silver', threshold: 50, xp: 150 },
      { tier: 'gold', threshold: 100, xp: 350 },
      { tier: 'platinum', threshold: 300, xp: 700 },
      { tier: 'diamond', threshold: 500, xp: 1400 },
    ],
  },
  {
    id: 'review-expert',
    name: 'Review Expert',
    description: 'Review pull requests',
    category: 'pull-request',
    icon: '👁️',
    rarity: 'rare',
    measureLabel: 'reviews',
    levels: [
      { tier: 'bronze', threshold: 5, xp: 40 },
      { tier: 'silver', threshold: 25, xp: 100 },
      { tier: 'gold', threshold: 100, xp: 250 },
      { tier: 'platinum', threshold: 250, xp: 500 },
      { tier: 'diamond', threshold: 500, xp: 1000 },
    ],
  },
  {
    id: 'pr-legend',
    name: 'PR Legend',
    description: 'Become a pull request legend',
    category: 'pull-request',
    icon: '🏅',
    rarity: 'legendary',
    measureLabel: 'PRs',
    levels: [
      { tier: 'bronze', threshold: 200, xp: 200 },
      { tier: 'silver', threshold: 500, xp: 500 },
      { tier: 'gold', threshold: 1000, xp: 1000 },
      { tier: 'platinum', threshold: 2000, xp: 2000 },
      { tier: 'diamond', threshold: 5000, xp: 4000 },
    ],
  },

  // ⭐ Repository
  {
    id: 'star-collector',
    name: 'Star Collector',
    description: 'Earn stars on your repositories',
    category: 'repository',
    icon: '⭐',
    rarity: 'uncommon',
    measureLabel: 'stars',
    levels: [
      { tier: 'bronze', threshold: 10, xp: 30 },
      { tier: 'silver', threshold: 50, xp: 80 },
      { tier: 'gold', threshold: 100, xp: 200 },
      { tier: 'platinum', threshold: 500, xp: 500 },
      { tier: 'diamond', threshold: 1000, xp: 1000 },
    ],
  },
  {
    id: 'repository-creator',
    name: 'Repository Creator',
    description: 'Create public repositories',
    category: 'repository',
    icon: '📦',
    rarity: 'common',
    measureLabel: 'repos',
    levels: [
      { tier: 'bronze', threshold: 3, xp: 20 },
      { tier: 'silver', threshold: 10, xp: 50 },
      { tier: 'gold', threshold: 25, xp: 100 },
      { tier: 'platinum', threshold: 50, xp: 200 },
      { tier: 'diamond', threshold: 100, xp: 400 },
    ],
  },
  {
    id: 'project-maintainer',
    name: 'Project Maintainer',
    description: 'Maintain repositories with forks',
    category: 'repository',
    icon: '🔧',
    rarity: 'rare',
    measureLabel: 'forks',
    levels: [
      { tier: 'bronze', threshold: 5, xp: 40 },
      { tier: 'silver', threshold: 25, xp: 100 },
      { tier: 'gold', threshold: 100, xp: 250 },
      { tier: 'platinum', threshold: 250, xp: 500 },
      { tier: 'diamond', threshold: 500, xp: 1000 },
    ],
  },
  {
    id: 'hidden-gem',
    name: 'Hidden Gem',
    description: 'Create a repo with high stars relative to age',
    category: 'repository',
    icon: '💎',
    rarity: 'epic',
    measureLabel: 'top star density',
    levels: [
      { tier: 'bronze', threshold: 0.5, xp: 60 },
      { tier: 'silver', threshold: 1, xp: 150 },
      { tier: 'gold', threshold: 2, xp: 350 },
      { tier: 'platinum', threshold: 5, xp: 700 },
      { tier: 'diamond', threshold: 10, xp: 1500 },
    ],
  },
  {
    id: 'repository-explorer',
    name: 'Repository Explorer',
    description: 'Contribute to many repositories',
    category: 'repository',
    icon: '🗺️',
    rarity: 'uncommon',
    measureLabel: 'contributed repos',
    levels: [
      { tier: 'bronze', threshold: 5, xp: 30 },
      { tier: 'silver', threshold: 15, xp: 80 },
      { tier: 'gold', threshold: 30, xp: 150 },
      { tier: 'platinum', threshold: 50, xp: 300 },
      { tier: 'diamond', threshold: 100, xp: 600 },
    ],
  },

  // 🤝 Collaboration
  {
    id: 'open-source-explorer',
    name: 'Open Source Explorer',
    description: 'Contribute to repositories you do not own',
    category: 'collaboration',
    icon: '🌍',
    rarity: 'uncommon',
    measureLabel: 'outside contributions',
    levels: [
      { tier: 'bronze', threshold: 3, xp: 40 },
      { tier: 'silver', threshold: 10, xp: 100 },
      { tier: 'gold', threshold: 25, xp: 200 },
      { tier: 'platinum', threshold: 50, xp: 400 },
      { tier: 'diamond', threshold: 100, xp: 800 },
    ],
  },
  {
    id: 'collaboration-champion',
    name: 'Collaboration Champion',
    description: 'Engage with issues and PRs',
    category: 'collaboration',
    icon: '🤝',
    rarity: 'rare',
    measureLabel: 'issues + PRs',
    levels: [
      { tier: 'bronze', threshold: 10, xp: 50 },
      { tier: 'silver', threshold: 50, xp: 120 },
      { tier: 'gold', threshold: 100, xp: 280 },
      { tier: 'platinum', threshold: 300, xp: 550 },
      { tier: 'diamond', threshold: 500, xp: 1100 },
    ],
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Collaborate across many repos',
    category: 'collaboration',
    icon: '👥',
    rarity: 'epic',
    measureLabel: 'collaborators across repos',
    levels: [
      { tier: 'bronze', threshold: 3, xp: 50 },
      { tier: 'silver', threshold: 10, xp: 150 },
      { tier: 'gold', threshold: 25, xp: 350 },
      { tier: 'platinum', threshold: 50, xp: 700 },
      { tier: 'diamond', threshold: 100, xp: 1500 },
    ],
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Build a community around your repos',
    category: 'collaboration',
    icon: '🏛️',
    rarity: 'legendary',
    measureLabel: 'total community engagement',
    levels: [
      { tier: 'bronze', threshold: 100, xp: 100 },
      { tier: 'silver', threshold: 500, xp: 300 },
      { tier: 'gold', threshold: 1000, xp: 600 },
      { tier: 'platinum', threshold: 5000, xp: 1500 },
      { tier: 'diamond', threshold: 10000, xp: 3000 },
    ],
  },

  // 🧠 Technology
  {
    id: 'polyglot-developer',
    name: 'Polyglot Developer',
    description: 'Use many programming languages',
    category: 'technology',
    icon: '🐙',
    rarity: 'rare',
    measureLabel: 'languages',
    levels: [
      { tier: 'bronze', threshold: 3, xp: 40 },
      { tier: 'silver', threshold: 5, xp: 100 },
      { tier: 'gold', threshold: 8, xp: 200 },
      { tier: 'platinum', threshold: 12, xp: 400 },
      { tier: 'diamond', threshold: 15, xp: 800 },
    ],
  },
  {
    id: 'ai-explorer',
    name: 'AI Explorer',
    description: 'Work with AI/ML repositories',
    category: 'technology',
    icon: '🤖',
    rarity: 'epic',
    measureLabel: 'AI repos',
    levels: [
      { tier: 'bronze', threshold: 1, xp: 60 },
      { tier: 'silver', threshold: 3, xp: 150 },
      { tier: 'gold', threshold: 5, xp: 350 },
      { tier: 'platinum', threshold: 10, xp: 700 },
      { tier: 'diamond', threshold: 20, xp: 1500 },
    ],
  },
  {
    id: 'frontend-specialist',
    name: 'Frontend Specialist',
    description: 'Master frontend technologies',
    category: 'technology',
    icon: '🎨',
    rarity: 'uncommon',
    measureLabel: 'frontend repos',
    levels: [
      { tier: 'bronze', threshold: 2, xp: 30 },
      { tier: 'silver', threshold: 5, xp: 80 },
      { tier: 'gold', threshold: 10, xp: 150 },
      { tier: 'platinum', threshold: 20, xp: 300 },
      { tier: 'diamond', threshold: 35, xp: 600 },
    ],
  },
  {
    id: 'backend-specialist',
    name: 'Backend Specialist',
    description: 'Master backend technologies',
    category: 'technology',
    icon: '⚙️',
    rarity: 'uncommon',
    measureLabel: 'backend repos',
    levels: [
      { tier: 'bronze', threshold: 2, xp: 30 },
      { tier: 'silver', threshold: 5, xp: 80 },
      { tier: 'gold', threshold: 10, xp: 150 },
      { tier: 'platinum', threshold: 20, xp: 300 },
      { tier: 'diamond', threshold: 35, xp: 600 },
    ],
  },
  {
    id: 'full-stack-builder',
    name: 'Full Stack Builder',
    description: 'Master both frontend and backend',
    category: 'technology',
    icon: '🏗️',
    rarity: 'epic',
    measureLabel: 'fullstack repos',
    levels: [
      { tier: 'bronze', threshold: 3, xp: 80 },
      { tier: 'silver', threshold: 8, xp: 200 },
      { tier: 'gold', threshold: 15, xp: 400 },
      { tier: 'platinum', threshold: 25, xp: 800 },
      { tier: 'diamond', threshold: 50, xp: 1600 },
    ],
  },
];

const FRONTEND_LANGUAGES = new Set([
  'JavaScript',
  'TypeScript',
  'HTML',
  'CSS',
  'SCSS',
  'Sass',
  'Less',
  'Vue',
  'React',
  'Angular',
  'Svelte',
  'Elm',
  'CoffeeScript',
]);

const BACKEND_LANGUAGES = new Set([
  'Python',
  'Java',
  'Go',
  'Rust',
  'C#',
  'Ruby',
  'PHP',
  'C',
  'C++',
  'Kotlin',
  'Scala',
  'Swift',
  'Dart',
  'Elixir',
  'Haskell',
  'Clojure',
  'Erlang',
  'Zig',
  'Nim',
  'Crystal',
]);

const AI_KEYWORDS = [
  'ai',
  'artificial-intelligence',
  'machine-learning',
  'deep-learning',
  'neural-network',
  'tensorflow',
  'pytorch',
  'llm',
  'gpt',
  'language-model',
  'nlp',
  'computer-vision',
  'data-science',
  'ml',
  'openai',
  'huggingface',
  'transformers',
  'diffusion',
  'chatbot',
  'rag',
  'agent',
];

function computeAchievementState(currentValue: number, def: AchievementDef): AchievementState {
  const sortedLevels = [...def.levels].sort((a, b) => b.threshold - a.threshold);

  for (let i = 0; i < sortedLevels.length; i++) {
    const level = sortedLevels[i];
    if (currentValue >= level.threshold) {
      const currentTierIndex = def.levels.indexOf(level);
      const nextTier =
        currentTierIndex < def.levels.length - 1 ? def.levels[currentTierIndex + 1] : null;

      return {
        currentValue,
        targetValue: nextTier?.threshold ?? level.threshold,
        progress: nextTier
          ? Math.min(
              100,
              Math.round(
                ((currentValue - def.levels[0].threshold) /
                  (nextTier.threshold - def.levels[0].threshold)) *
                  100
              )
            )
          : 100,
        unlocked: true,
        currentTier: level.tier,
        currentTierIndex,
        nextTier,
        xpEarned: sortedLevels
          .filter((l) => currentValue >= l.threshold)
          .reduce((sum, l) => sum + l.xp, 0),
        unlockedAt: null,
      };
    }
  }

  const nextTier = def.levels[0];
  return {
    currentValue,
    targetValue: nextTier.threshold,
    progress: Math.min(100, Math.round((currentValue / nextTier.threshold) * 100)),
    unlocked: false,
    currentTier: null,
    currentTierIndex: -1,
    nextTier,
    xpEarned: 0,
    unlockedAt: null,
  };
}

function computeDeveloperLevel(totalXp: number): {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
} {
  let level = 1;
  let xpNeeded = 0;
  let cumulative = 0;

  while (true) {
    xpNeeded = level * 100;
    if (cumulative + xpNeeded > totalXp) break;
    cumulative += xpNeeded;
    level++;
  }

  const progress = xpNeeded > 0 ? Math.round(((totalXp - cumulative) / xpNeeded) * 100) : 0;

  return {
    level,
    xpForCurrentLevel: cumulative,
    xpForNextLevel: cumulative + xpNeeded,
    levelProgress: Math.min(100, progress),
  };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${request.headers.get('user-agent') ?? 'no-agent'}`;

  if (!(await achievementsLimiter.check(rateLimitKey))) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username || !validateGitHubUsername(username)) {
    return NextResponse.json({ error: 'Valid username parameter is required' }, { status: 400 });
  }

  try {
    const userToken = await getUserGitHubToken();
    const dashboardData = await getFullDashboardData(username, { token: userToken });

    const { profile, stats, languages } = dashboardData;
    const totalStars = profile.stats.stars;
    const totalForks =
      (dashboardData.popularRepos as Array<{ forkCount: number }> | undefined)?.reduce(
        (sum, r) => sum + (r.forkCount ?? 0),
        0
      ) ?? 0;
    const totalRepos = profile.stats.repositories;
    const contributedRepoCount =
      dashboardData.graphData?.nodes?.filter((n) => n.type === 'Contribution').length ?? 0;

    const allDays = (dashboardData.activity ?? []) as Array<{ count: number; date: string }>;
    const activeDays = allDays.filter((d) => d.count > 0).length;

    const weekendContributions = allDays
      .filter((d) => {
        const date = new Date(d.date + 'T12:00:00Z');
        const day = date.getUTCDay();
        return (day === 0 || day === 6) && d.count > 0;
      })
      .reduce((sum, d) => sum + d.count, 0);

    const languageNames = (languages as Array<{ name: string }>).map((l) => l.name);
    const uniqueLanguageCount = languageNames.length;

    const frontendCount = languageNames.filter((l) => FRONTEND_LANGUAGES.has(l)).length;
    const backendCount = languageNames.filter((l) => BACKEND_LANGUAGES.has(l)).length;

    const popularRepos = (dashboardData.popularRepos ?? []) as Array<{
      name: string;
      description: string | null;
      stargazerCount: number;
      createdAt: string;
    }>;
    const aiRepoCount = popularRepos.filter((repo) =>
      AI_KEYWORDS.some(
        (kw) =>
          repo.name.toLowerCase().includes(kw) ||
          (repo.description && repo.description.toLowerCase().includes(kw))
      )
    ).length;
    let topStarDensity = 0;
    for (const repo of popularRepos) {
      const ageInYears = Math.max(
        0.1,
        (Date.now() - new Date(repo.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      );
      const density = repo.stargazerCount / ageInYears;
      if (density > topStarDensity) topStarDensity = density;
    }

    const totalEngagement = totalStars + totalForks + stats.totalIssues + stats.totalPRs;

    const totalContributions = stats.totalContributions;
    const longestStreak = stats.peakStreak;

    const allCategories: AchievementCategory[] = [
      'contribution',
      'pull-request',
      'repository',
      'collaboration',
      'technology',
    ];

    const computedAchievements: Record<string, number> = {
      'commit-champion': totalContributions,
      'consistency-master': longestStreak,
      'daily-contributor': activeDays,
      'marathon-coder': totalContributions,
      'weekend-warrior': weekendContributions,
      'pr-rookie': stats.totalPRs,
      'pr-master': stats.totalPRs,
      'merge-master': stats.totalPRs,
      'review-expert': stats.totalReviews,
      'pr-legend': stats.totalPRs,
      'star-collector': totalStars,
      'repository-creator': totalRepos,
      'project-maintainer': totalForks,
      'hidden-gem': topStarDensity,
      'repository-explorer': contributedRepoCount,
      'open-source-explorer': contributedRepoCount,
      'collaboration-champion': stats.totalIssues + stats.totalPRs,
      'team-player': contributedRepoCount,
      'community-builder': totalEngagement,
      'polyglot-developer': uniqueLanguageCount,
      'ai-explorer': aiRepoCount,
      'frontend-specialist': frontendCount,
      'backend-specialist': backendCount,
      'full-stack-builder': frontendCount + backendCount,
    };

    const allAchievements: AchievementData[] = ACHIEVEMENT_DEFS.map((def) => {
      const value = computedAchievements[def.id] ?? 0;
      const state = computeAchievementState(value, def);
      return { def, state };
    });

    const unlocked = allAchievements.filter((a) => a.state.unlocked);
    const totalXp = unlocked.reduce((sum, a) => sum + a.state.xpEarned, 0);

    const levelInfo = computeDeveloperLevel(totalXp);

    const categories = allCategories.map((cat) => {
      const items = allAchievements.filter((a) => a.def.category === cat);
      return {
        category: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        icon:
          cat === 'contribution'
            ? '🔥'
            : cat === 'pull-request'
              ? '🚀'
              : cat === 'repository'
                ? '⭐'
                : cat === 'collaboration'
                  ? '🤝'
                  : '🧠',
        achievements: items,
        unlockedCount: items.filter((a) => a.state.unlocked).length,
        totalCount: items.length,
      };
    });

    const sortedUnlocks = [...unlocked].sort((a, b) => b.state.xpEarned - a.state.xpEarned);
    const locked = allAchievements.filter((a) => !a.state.unlocked);

    const response: AchievementsResponse = {
      username,
      profile: {
        avatarUrl: profile.avatarUrl,
        name: profile.name,
        login: profile.username,
      },
      overview: {
        totalAchievements: allAchievements.length,
        unlockedCount: unlocked.length,
        completionPercent: Math.round((unlocked.length / allAchievements.length) * 100),
        totalXp,
        developerLevel: levelInfo.level,
        xpForCurrentLevel: levelInfo.xpForCurrentLevel,
        xpForNextLevel: levelInfo.xpForNextLevel,
        levelProgress: levelInfo.levelProgress,
      },
      categories,
      recentUnlocks: sortedUnlocks.slice(0, 5),
      nextAchievement: locked[0] ?? null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (
      message.toLowerCase().includes('not found') ||
      message.toLowerCase().includes('could not resolve')
    ) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (message.toLowerCase().includes('rate limit') || message.includes('API limit reached')) {
      return NextResponse.json(
        { error: 'GitHub API rate limit reached. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
