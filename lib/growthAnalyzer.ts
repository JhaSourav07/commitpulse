import {
  DashboardExportData,
  GrowthAnalysisResult,
  ProductivitySpike,
  MonthlyProgressSummary,
  RoadmapGoal,
  RoadmapMilestone,
  CategoryRating,
} from '@/types/dashboard';

interface DashboardDataInput {
  profile: {
    username: string;
    name: string;
    avatarUrl: string;
    joinedDate: string;
    developerScore: number;
    stats: {
      repositories: number;
      followers: number;
      following: number;
      stars: number;
    };
  };
  stats: {
    currentStreak: number;
    peakStreak: number;
    totalContributions: number;
  };
  languages: Array<{
    name: string;
    color: string;
    percentage: number;
  }>;
  activity: Array<{
    date: string;
    count: number;
    intensity: 0 | 1 | 2 | 3 | 4;
    locAdditions?: number;
    locDeletions?: number;
  }>;
  commitClock: Array<{
    day: string;
    commits: number;
  }>;
}

export function analyzeGrowth(data: DashboardDataInput): GrowthAnalysisResult {
  const { profile, stats, languages, activity, commitClock } = data;
  const totalContributions = stats.totalContributions;
  const currentStreak = stats.currentStreak;
  const peakStreak = stats.peakStreak;

  // 1. Calculate Growth Score Breakdown
  // A. Frequency Score: Ratio of active days in the last year
  const activeDaysCount = activity.filter((d) => d.count > 0).length;
  const totalDaysCount = activity.length || 365;
  const activeRatio = activeDaysCount / totalDaysCount;
  // A perfect frequency score is achieved if active 30% of the year (approx 110 days)
  const frequencyScore = Math.min(100, Math.round((activeRatio / 0.3) * 100));

  // B. Consistency Score: Based on peak streak and longest inactive gap
  let currentGap = 0;
  let longestGap = 0;
  activity.forEach((day) => {
    if (day.count === 0) {
      currentGap++;
    } else {
      if (currentGap > longestGap) {
        longestGap = currentGap;
      }
      currentGap = 0;
    }
  });
  if (currentGap > longestGap) {
    longestGap = currentGap;
  }

  const streakFactor = Math.min(100, (peakStreak / 21) * 100); // 21 days saturates
  const gapPenalty = Math.max(0, 100 - longestGap * 4); // 25 days gap results in 0
  const consistencyScore = Math.round(0.5 * streakFactor + 0.5 * gapPenalty);

  // C. Volume Score: Based on total contributions, saturates at 250
  const volumeScore = Math.min(100, Math.round((totalContributions / 250) * 100));

  // D. Quality Score: Based on average Lines of Code (LoC) proxy per contribution
  let totalAdditions = 0;
  let totalDeletions = 0;
  activity.forEach((day) => {
    totalAdditions += day.locAdditions || 0;
    totalDeletions += day.locDeletions || 0;
  });
  const totalLoc = totalAdditions + totalDeletions;
  const avgLocPerContribution = activeDaysCount > 0 ? totalLoc / activeDaysCount : 0;
  // Saturates at 100 average lines of code (additions + deletions) per active day
  const rawQualityScore = Math.min(100, Math.round((avgLocPerContribution / 100) * 100));

  // Bonus for balanced refactoring: If deletions represent 15%-40% of additions
  let refactorBonus = 0;
  if (totalAdditions > 0 && totalDeletions > 0) {
    const deletionRatio = totalDeletions / totalAdditions;
    if (deletionRatio >= 0.15 && deletionRatio <= 0.45) {
      refactorBonus = 10;
    }
  }
  const qualityScore = Math.min(100, rawQualityScore + refactorBonus);

  // Overall Growth Score (Weighted average)
  const growthScore = Math.round(
    0.3 * frequencyScore + 0.3 * consistencyScore + 0.2 * volumeScore + 0.2 * qualityScore
  );

  // 2. Growth Trend
  // Compare the last 30 days of contributions with the preceding 30 days
  const sortedActivity = [...activity].sort((a, b) => a.date.localeCompare(b.date));
  const last30 = sortedActivity.slice(-30);
  const prev30 = sortedActivity.slice(-60, -30);

  const last30Count = last30.reduce((sum, d) => sum + d.count, 0);
  const prev30Count = prev30.reduce((sum, d) => sum + d.count, 0);

  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  let changePercentage = 0;
  let trendText = '';

  if (prev30Count > 0) {
    changePercentage = Math.round(((last30Count - prev30Count) / prev30Count) * 100);
    if (changePercentage > 5) {
      trendDirection = 'up';
      trendText = `Your monthly contribution velocity increased by ${changePercentage}% compared to the previous month! Keep pushing code!`;
    } else if (changePercentage < -5) {
      trendDirection = 'down';
      trendText = `Your monthly contribution velocity dropped by ${Math.abs(changePercentage)}%. Try setting a weekly goal to get back on track.`;
    } else {
      trendDirection = 'stable';
      trendText = `Your contribution momentum remains stable (changed by ${changePercentage}%). Consistency is key to long-term impact.`;
    }
  } else {
    changePercentage = last30Count > 0 ? 100 : 0;
    trendDirection = last30Count > 0 ? 'up' : 'stable';
    trendText =
      last30Count > 0
        ? `Started active coding with ${last30Count} contributions in the last 30 days!`
        : 'Maintain a steady pace by planning small, incremental contributions.';
  }

  // 3. Consistency Analysis
  const activeDaysRatio = Math.round((activeDaysCount / totalDaysCount) * 100);
  let consistencyDescription = '';
  if (longestGap <= 3) {
    consistencyDescription =
      'Exceptional daily consistency! You rarely take breaks longer than a weekend, maintaining high momentum.';
  } else if (longestGap <= 7) {
    consistencyDescription =
      'Good coding habits. You occasionally take a week-long break to recharge, which is great for avoiding burnout.';
  } else if (longestGap <= 14) {
    consistencyDescription =
      'Moderate consistency. You have gaps of up to two weeks between contributions. Try to establish a regular weekly routine.';
  } else {
    consistencyDescription =
      'Irregular contribution patterns. You had inactive periods of over two weeks. Building a habit of small weekly updates will boost your growth score.';
  }

  // 4. Productivity Spikes
  const spikeDays = activity
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const productivitySpikes: ProductivitySpike[] = spikeDays.map((d) => {
    const formattedDate = new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return {
      date: d.date,
      count: d.count,
      description: `Productivity burst on ${formattedDate} with ${d.count} commits/PRs. Approximate code impact: +${d.locAdditions || 0} additions, -${d.locDeletions || 0} deletions.`,
    };
  });

  // 5. Skill & Repository Recommendations
  const primaryLang = languages[0]?.name || 'JavaScript';
  const detectedTechs = languages.map((l) => l.name);

  // Strongest areas determination
  const strongestAreas: string[] = [];
  const webTechs = ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vue', 'React'];
  const backendTechs = ['Go', 'Python', 'Java', 'Rust', 'C++', 'Ruby', 'PHP', 'C#'];

  const hasWeb = languages.some((l) => webTechs.includes(l.name));
  const hasBackend = languages.some((l) => backendTechs.includes(l.name));
  const hasRustOrCpp = languages.some((l) => ['Rust', 'C++', 'C'].includes(l.name));

  if (hasWeb && hasBackend) {
    strongestAreas.push('Full-Stack Applications', 'Web Engineering');
  } else if (hasWeb) {
    strongestAreas.push('Frontend User Interfaces', 'Client-side Engineering');
  } else if (hasBackend) {
    strongestAreas.push('Backend Architecture', 'Server-side Systems & APIs');
  } else {
    strongestAreas.push('General Software Development');
  }

  if (hasRustOrCpp) {
    strongestAreas.push('Systems Development & High Performance Code');
  }

  // Determine difficulty suggestions
  let roadmapDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
  if (totalContributions >= 100 || profile.developerScore >= 70) {
    roadmapDifficulty = 'Advanced';
  } else if (totalContributions >= 20 || profile.developerScore >= 35) {
    roadmapDifficulty = 'Intermediate';
  }

  const recommendedDomains = [
    {
      name: 'Modern Web Frontends',
      description: `Contribute to component systems, UI components, and state management in ${primaryLang}.`,
      difficulty: 'Intermediate' as const,
      suggestedRepos: [
        {
          name: 'facebook/react',
          url: 'https://github.com/facebook/react',
          description:
            'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
        },
        {
          name: 'vercel/next.js',
          url: 'https://github.com/vercel/next.js',
          description: 'The React Framework for the Web.',
        },
      ],
    },
    {
      name: 'APIs & Backend Logic',
      description:
        'Implement robust APIs, controllers, database models, and write server-side algorithms.',
      difficulty: 'Intermediate' as const,
      suggestedRepos: [
        {
          name: 'expressjs/express',
          url: 'https://github.com/expressjs/express',
          description: 'Fast, unopinionated, minimalist web framework for node.',
        },
        {
          name: 'django/django',
          url: 'https://github.com/django/django',
          description: 'The Web framework for perfectionists with deadlines.',
        },
      ],
    },
    {
      name: 'System Utilities & Tools',
      description: 'Build command-line interfaces, developer utilities, and optimization scripts.',
      difficulty: roadmapDifficulty,
      suggestedRepos: [
        {
          name: 'rust-lang/cargo',
          url: 'https://github.com/rust-lang/cargo',
          description: 'The Rust package manager.',
        },
        {
          name: 'spf13/cobra',
          url: 'https://github.com/spf13/cobra',
          description: 'A Commander for modern Go CLI interactions.',
        },
      ],
    },
  ];

  // 6. Personalized Contribution Roadmap
  // Short-Term Goals
  const shortTermGoals: RoadmapGoal[] = [
    {
      id: 'st-streak',
      title: 'Maintain a 5-Day Coding Streak',
      target: 'Keep active coding contributions going daily',
      progress: Math.min(100, Math.round((currentStreak / 5) * 100)),
      completed: currentStreak >= 5,
      difficulty: 'Easy',
    },
    {
      id: 'st-volume',
      title: 'Active Coding Week',
      target: 'At least 4 contribution days in the last 7 days',
      progress: Math.min(
        100,
        Math.round((activity.slice(-7).filter((d) => d.count > 0).length / 4) * 100)
      ),
      completed: activity.slice(-7).filter((d) => d.count > 0).length >= 4,
      difficulty: 'Medium',
    },
    {
      id: 'st-quality',
      title: 'Write Meaningful Code Changes',
      target: 'Accumulate 300+ Lines of Code additions/deletions in active tasks',
      progress: Math.min(100, Math.round((totalLoc / 300) * 100)),
      completed: totalLoc >= 300,
      difficulty: 'Easy',
    },
  ];

  // Long-Term Goals
  const longTermGoals: RoadmapGoal[] = [
    {
      id: 'lt-volume',
      title: 'Contribution Century Mark',
      target: 'Reach 100 total contributions this year',
      progress: Math.min(100, Math.round((totalContributions / 100) * 100)),
      completed: totalContributions >= 100,
      difficulty: 'Medium',
    },
    {
      id: 'lt-streak',
      title: 'Consistency Master Streak',
      target: 'Achieve a peak streak of 15 days',
      progress: Math.min(100, Math.round((peakStreak / 15) * 100)),
      completed: peakStreak >= 15,
      difficulty: 'Hard',
    },
    {
      id: 'lt-languages',
      title: 'Polyglot Developer Integration',
      target: 'Contribute using at least 3 distinct programming languages',
      progress: Math.min(100, Math.round((languages.length / 3) * 100)),
      completed: languages.length >= 3,
      difficulty: 'Medium',
    },
  ];

  // Roadmap Milestones
  const milestones: RoadmapMilestone[] = [
    {
      id: 'ms-first',
      title: 'First Contribution',
      requirement: 'Unlocked by making your first code commit or pull request.',
      unlocked: totalContributions >= 1,
      icon: '🌱',
      badgeName: 'Initiator Badge',
    },
    {
      id: 'ms-ten',
      title: 'First 10 Contributions',
      requirement: 'Unlocked by reaching 10 total contributions.',
      unlocked: totalContributions >= 10,
      icon: '🚀',
      badgeName: 'Active Contributor',
    },
    {
      id: 'ms-feature',
      title: 'First Merged Feature',
      requirement: 'Unlocked by making at least 25 total contributions.',
      unlocked: totalContributions >= 25,
      icon: '🛠️',
      badgeName: 'Feature Builder',
    },
    {
      id: 'ms-docs',
      title: 'Documentation Specialist',
      requirement:
        'Write extensive changes (unlocked if Markdown/HTML in languages, or total contributions >= 5).',
      unlocked:
        languages.some((l) => ['HTML', 'CSS', 'Markdown'].includes(l.name)) ||
        totalContributions >= 5,
      icon: '✍️',
      badgeName: 'Docs Architect',
    },
    {
      id: 'ms-streak-7',
      title: 'Consistency Streak (7-day)',
      requirement: 'Maintain an active coding streak of 7 days.',
      unlocked: peakStreak >= 7,
      icon: '🔥',
      badgeName: 'Streak Runner',
    },
    {
      id: 'ms-streak-15',
      title: 'Streaker Elite (15-day)',
      requirement: 'Maintain an active coding streak of 15 days.',
      unlocked: peakStreak >= 15,
      icon: '👑',
      badgeName: 'Streak Monarch',
    },
  ];

  // 7. AI Recommendations
  let difficultyReason = '';
  if (roadmapDifficulty === 'Advanced') {
    difficultyReason = `With ${totalContributions} total contributions and a developer score of ${profile.developerScore}, you are in the top tier of open-source builders. Focus on architectural improvements, API refactoring, and project maintainership.`;
  } else if (roadmapDifficulty === 'Intermediate') {
    difficultyReason = `You have completed ${totalContributions} contributions. You understand standard Git processes. We suggest taking on medium-difficulty feature additions and complex bugs.`;
  } else {
    difficultyReason = `You are starting your open-source journey. We recommend focusing on documentation improvements, simple unit tests, and introductory 'good first issue' bug fixes.`;
  }

  // Categories ratings (Bug Fixes, Features, Documentation, Testing, Refactoring)
  // Let's compute them dynamically
  const bugFixesScore = Math.min(100, Math.round(50 + profile.developerScore / 2));
  const featuresScore = Math.min(100, Math.round(40 + qualityScore / 2 + volumeScore / 10));

  const docScore = languages.some((l) => ['HTML', 'CSS'].includes(l.name)) ? 90 : 70;

  const testingScore = Math.min(100, Math.round(30 + frequencyScore / 2 + qualityScore / 4));

  const refactoringScore = Math.min(100, Math.round(35 + qualityScore * 0.6));

  const categoryRatings: CategoryRating[] = (
    [
      {
        category: 'Bug Fixes',
        score: bugFixesScore,
        description:
          'Excellent for logical debugging and improving stability. Suggested difficulty: ' +
          roadmapDifficulty +
          '.',
      },
      {
        category: 'Features',
        score: featuresScore,
        description:
          'Building new components and modules. Best suited when you have a block of dedicated focus time.',
      },
      {
        category: 'Documentation',
        score: docScore,
        description:
          'Crucial for onboarding new developers. Writing setup guides, API specs, or translations.',
      },
      {
        category: 'Testing',
        score: testingScore,
        description:
          'Writing unit tests, integration tests, and fixing CI/CD pipeline issues to stabilize builds.',
      },
      {
        category: 'Refactoring',
        score: refactoringScore,
        description:
          'Cleaning up technical debt, modularizing code, and improving readability without changing behavior.',
      },
    ] as CategoryRating[]
  ).sort((a, b) => b.score - a.score);

  // General improvement suggestions
  const improvementSuggestions: string[] = [];
  if (peakStreak < 5) {
    improvementSuggestions.push(
      'Establish a daily coding habit: even adding 1-2 lines of comments or correcting typos keeps your streak active and builds memory.'
    );
  } else {
    improvementSuggestions.push(
      `Excellent streak habit of ${peakStreak} days! Guard your streak by staging small, independent PR reviews or documentation updates.`
    );
  }

  if (longestGap > 10) {
    improvementSuggestions.push(
      `Your longest inactive period of ${longestGap} days represents a drop in coding memory. Set a calendar reminder to do a quick 15-minute repository sweep every Sunday.`
    );
  }

  if (languages.length === 0) {
    improvementSuggestions.push(
      'Expand your profile by pushing code in any programming language to start tracking your skill metrics.'
    );
  } else if (languages.length === 1) {
    improvementSuggestions.push(
      `You are specializing 100% in ${primaryLang}. Expand your toolkit by picking up a complementary language (e.g., Go or Python if you are a frontend developer).`
    );
  } else {
    const lang1 = languages[0]?.name || 'primary language';
    const lang2 = languages[1]?.name || 'secondary language';
    improvementSuggestions.push(
      `Nice polyglot profile with ${languages.length} languages. Try building a bridge project connecting your top two languages (e.g., a ${lang1} frontend with a ${lang2} backend API).`
    );
  }

  if (profile.stats.stars === 0) {
    improvementSuggestions.push(
      'Boost your project visibility: document your top repositories with a beautiful README.md, list clear screenshots, and share your work on developer communities.'
    );
  }

  // 8. Monthly Progress Summaries
  const monthTotals: Record<string, number> = {};
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Initialize last 6 months
  const now = new Date();
  const activeMonths: { key: string; name: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    activeMonths.push({
      key,
      name: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    });
    monthTotals[key] = 0;
  }

  // Populate counts
  activity.forEach((day) => {
    const key = day.date.substring(0, 7);
    if (monthTotals[key] !== undefined) {
      monthTotals[key] += day.count;
    }
  });

  const monthlyProgressSummaries: MonthlyProgressSummary[] = activeMonths.map((am) => {
    const count = monthTotals[am.key];
    let summary = '';
    if (count === 0) {
      summary =
        'Inactive month. Focus was likely on planning, learning theoretical concepts, or taking a break.';
    } else if (count < 10) {
      summary = `Steady progress with ${count} contributions. Focus was primarily on minor bug fixes and repository setup.`;
    } else if (count < 30) {
      summary = `Active builder month! With ${count} contributions, you refactored modules, added secondary features, and enhanced tests.`;
    } else {
      summary = `High productivity month! Outstanding velocity with ${count} contributions, showing major features pushed or a sprint of consistent commits.`;
    }
    return {
      month: am.name,
      contributions: count,
      summary,
    };
  });

  return {
    growthScore,
    growthScoreBreakdown: {
      frequencyScore,
      consistencyScore,
      volumeScore,
      qualityScore,
    },
    growthTrend: {
      period: 'Last 30 Days',
      text: trendText,
      direction: trendDirection,
      changePercentage,
    },
    consistencyAnalysis: {
      activeDaysRatio,
      longestActiveGap: longestGap,
      longestStreak: peakStreak,
      description: consistencyDescription,
    },
    productivitySpikes,
    skillInsights: {
      primaryLanguage: primaryLang,
      detectedTechs,
      strongestAreas,
      recommendedDomains,
    },
    personalizedRoadmap: {
      shortTermGoals,
      longTermGoals,
      milestones,
    },
    aiRecommendations: {
      difficultyLevel: roadmapDifficulty,
      difficultyReason,
      categoryRatings,
      improvementSuggestions,
    },
    monthlyProgressSummaries,
  };
}
