'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RefreshCw, Share2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Achievement } from '@/types/dashboard';
import type { GraphNode, GraphLink } from '@/types';

import RefreshButton from './RefreshButton';
import ProfileCard from './ProfileCard';
import Achievements from './Achievements';
import ActivityLandscape from './ActivityLandscape';
import LanguageChart from './LanguageChart';
import CommitClock from './CommitClock';
import Heatmap from './Heatmap';
import AIInsights from './AIInsights';
import StatsCard from './StatsCard';
import RepositoryGraph from './RepositoryGraph';
import ComparisonStatsCard from './ComparisonStatsCard';
import RadarChart from './RadarChart';
import GrowthTrendChart from './GrowthTrendChart';
import ProfileOptimizerModal from './ProfileOptimizerModal';

// Define the dashboard data structure
interface DashboardData {
  profile: {
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
  }>;
  insights: Array<{
    id: string;
    icon: string;
    text: string;
  }>;
  achievements: Achievement[];
  commitClock: Array<{
    day: string;
    commits: number;
  }>;
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

interface DashboardClientProps {
  initialData: DashboardData;
  username: string;
}

export interface ProfileMetrics {
  currentStreak: number;
  commitClock: { day: string; commits: number }[]; // e.g., Sun-Sat daily totals
  hourlyData?: { hour: number; commits: number }[]; // Optional: 0-23 hour distribution
}

export interface CoderProfile {
  peakHourStart: number;
  peakHourEnd: number;
  profileName: 'Night Owl 🌙' | 'Early Builder ☀' | 'Weekend Warrior 🚀' | 'Consistent Runner 🏃‍♂️';
  hourlyDistribution: number[];
  activeWeekdays: string[];
}

export function generateCoderProfile(metrics: ProfileMetrics): CoderProfile {
  const { currentStreak, commitClock, hourlyData } = metrics;

  let profileName: CoderProfile['profileName'] = 'Early Builder ☀';

  // 1. Analyze Commit Clock for Weekend Warrior
  let isWeekendWarrior = false;
  if (commitClock && commitClock.length === 7) {
    const weekendCommits = commitClock[0].commits + commitClock[6].commits; // Sunday(0) + Saturday(6)
    const totalCommits = commitClock.reduce((sum, d) => sum + d.commits, 0);
    if (totalCommits > 0 && weekendCommits / totalCommits > 0.35) {
      isWeekendWarrior = true;
    }
  }

  // 2. Analyze Hourly Data for Night Owl vs Early Builder
  let isNightOwl = false;
  if (hourlyData && hourlyData.length > 0) {
    const nightCommits = hourlyData
      .filter((d) => d.hour >= 22 || d.hour <= 3)
      .reduce((sum, d) => sum + d.commits, 0);

    const morningCommits = hourlyData
      .filter((d) => d.hour >= 5 && d.hour <= 10)
      .reduce((sum, d) => sum + d.commits, 0);

    isNightOwl = nightCommits > morningCommits;
  }

  // 3. Determine Final Profile Type
  if (currentStreak >= 10) {
    profileName = 'Consistent Runner 🏃‍♂️';
  } else if (isWeekendWarrior) {
    profileName = 'Weekend Warrior 🚀';
  } else if (isNightOwl) {
    profileName = 'Night Owl 🌙';
  }

  // 4. Populate UI properties based on the derived profile.
  // We use smooth curves here without the random 'hash' jitter for a cleaner UI.
  let peakHourStart = 9;
  let peakHourEnd = 17;
  let hourlyDistribution = new Array(24).fill(0);
  let activeWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  if (profileName === 'Night Owl 🌙') {
    peakHourStart = 22;
    peakHourEnd = 2;
    hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
      const distFromMidnight = Math.min(Math.abs(h - 23), Math.abs(h + 1));
      return Math.max(8, Math.round(100 - distFromMidnight * 9.5));
    });
    activeWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  } else if (profileName === 'Early Builder ☀') {
    peakHourStart = 6;
    peakHourEnd = 10;
    hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
      const distFromEight = Math.abs(h - 8);
      return Math.max(6, Math.round(100 - distFromEight * 10));
    });
    activeWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  } else if (profileName === 'Weekend Warrior 🚀') {
    peakHourStart = 10;
    peakHourEnd = 16;
    hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
      const distFromMidday = Math.abs(h - 13);
      return Math.max(8, Math.round(100 - distFromMidday * 8.5));
    });
    activeWeekdays = ['Sat', 'Sun'];
  } else if (profileName === 'Consistent Runner 🏃‍♂️') {
    peakHourStart = 13;
    peakHourEnd = 17;
    hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
      const distFromThree = Math.abs(h - 15);
      return Math.max(12, Math.round(100 - distFromThree * 7));
    });
    activeWeekdays = ['Mon', 'Wed', 'Fri', 'Sat'];
  }

  return {
    peakHourStart,
    peakHourEnd,
    profileName,
    hourlyDistribution,
    activeWeekdays,
  };
}

function calculateInactivityGaps(activity: Array<{ date: string; count: number }>) {
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

  return longestGap;
}

function calculateComebackStreak(activity: Array<{ date: string; count: number }>) {
  let currentGap = 0;
  let longestGap = 0;
  let longestGapEndIndex = -1;

  activity.forEach((day, index) => {
    if (day.count === 0) {
      currentGap++;
    } else {
      if (currentGap > longestGap) {
        longestGap = currentGap;
        longestGapEndIndex = index;
      }
      currentGap = 0;
    }
  });

  if (longestGapEndIndex === -1 || longestGap === 0) {
    return 0;
  }

  let comebackStreak = 0;
  for (let i = longestGapEndIndex; i < activity.length; i++) {
    if (activity[i].count > 0) {
      comebackStreak++;
    } else {
      break;
    }
  }
  return comebackStreak;
}

function calculateRecoverySpeed(activity: Array<{ date: string; count: number }>) {
  let currentGap = 0;
  let longestGap = 0;
  let longestGapEndIndex = -1;

  activity.forEach((day, index) => {
    if (day.count === 0) {
      currentGap++;
    } else {
      if (currentGap > longestGap) {
        longestGap = currentGap;
        longestGapEndIndex = index;
      }
      currentGap = 0;
    }
  });

  if (longestGapEndIndex === -1 || longestGap === 0) {
    return 0;
  }

  let sum = 0;
  let count = 0;
  for (let i = longestGapEndIndex; i < Math.min(activity.length, longestGapEndIndex + 7); i++) {
    sum += activity[i].count;
    count++;
  }

  return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
}

function getPersonalityTags(
  profile: DashboardData['profile'],
  stats: DashboardData['stats'],
  languages: DashboardData['languages'],
  coderProfile: CoderProfile
): string[] {
  const tags: string[] = [];

  if (stats.peakStreak >= 30) {
    tags.push('Consistency Beast 🔥');
  } else if (stats.peakStreak >= 15) {
    tags.push('Streak Runner ⚡');
  }

  if (stats.totalContributions >= 500) {
    tags.push('Hardcore Committer 💻');
  } else if (stats.totalContributions >= 200) {
    tags.push('Active Committer 🛠️');
  }

  if (profile.stats.repositories >= 25) {
    tags.push('Open Source Explorer 🚀');
  }

  const hasFrontend = languages.some((l) =>
    ['TypeScript', 'JavaScript', 'HTML', 'CSS'].includes(l.name)
  );
  const hasBackend = languages.some((l) =>
    ['Python', 'Java', 'Go', 'Rust', 'C++', 'Ruby', 'PHP', 'C#'].includes(l.name)
  );

  if (hasFrontend && hasBackend) {
    tags.push('Full Stack Builder 🧠');
  } else if (hasFrontend) {
    tags.push('UI Craftsman 🎨');
  } else if (hasBackend) {
    tags.push('Backend Architect ⚙️');
  }

  if (coderProfile.profileName === 'Night Owl 🌙') {
    tags.push('Night Coder 🌙');
  } else if (coderProfile.profileName === 'Early Builder ☀') {
    tags.push('Early Builder ☀');
  } else if (coderProfile.profileName === 'Weekend Warrior 🚀') {
    tags.push('Weekend Warrior 🚀');
  }

  return tags.slice(0, 3);
}

// ------------------------------------------------------------
// DashboardClient Component
// ------------------------------------------------------------

export default function DashboardClient({ initialData, username }: DashboardClientProps) {
  const [secondUserData, setSecondUserData] = useState<DashboardData | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [secondUsernameInput, setSecondUsernameInput] = useState('');
  const [isLoadingSecond, setIsLoadingSecond] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenModal = () => {
    setSecondUsernameInput('');
    setCompareError(null);
    setIsModalOpen(true);
  };

  const handleFetchComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = secondUsernameInput.trim();
    if (!query) return;

    if (query.toLowerCase() === username.toLowerCase()) {
      setCompareError('Cannot compare a profile with itself.');
      return;
    }

    setIsLoadingSecond(true);
    setCompareError(null);

    try {
      const res = await fetch(`/api/github?username=${encodeURIComponent(query)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`GitHub user "${query}" not found`);
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch data (status ${res.status})`);
      }

      const data = await res.json();
      setSecondUserData(data);
      setIsCompareMode(true);
      setIsModalOpen(false);
      toast.success(`Comparing ${username} vs ${data.profile.username}`);
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : 'An error occurred while fetching profile data.';
      setCompareError(errMessage);
    } finally {
      setIsLoadingSecond(false);
    }
  };

  const handleExitCompare = () => {
    setIsCompareMode(false);
    setSecondUserData(null);
    toast.info('Returned to single profile view');
  };

  // ------------------------------------------------------------
  // Compare Mode Statistics Calculations
  // ------------------------------------------------------------

  // Profile for User A using their actual dashboard metrics
  const coderProfileA = generateCoderProfile({
    currentStreak: initialData.stats.currentStreak,
    commitClock: initialData.commitClock,
  });

  // Profile for User B using their comparison data metrics
  const coderProfileB = secondUserData
    ? generateCoderProfile({
        currentStreak: secondUserData.stats.currentStreak,
        commitClock: secondUserData.commitClock,
      })
    : null;
  const gapA = calculateInactivityGaps(initialData.activity);
  const gapB = secondUserData ? calculateInactivityGaps(secondUserData.activity) : 0;

  const recoveryA = calculateRecoverySpeed(initialData.activity);
  const recoveryB = secondUserData ? calculateRecoverySpeed(secondUserData.activity) : 0;

  const comebackA = calculateComebackStreak(initialData.activity);
  const comebackB = secondUserData ? calculateComebackStreak(secondUserData.activity) : 0;

  const badgesA: string[] = [];
  const badgesB: string[] = [];

  const personalityTagsA = getPersonalityTags(
    initialData.profile,
    initialData.stats,
    initialData.languages,
    coderProfileA
  );
  const personalityTagsB =
    secondUserData && coderProfileB
      ? getPersonalityTags(
          secondUserData.profile,
          secondUserData.stats,
          secondUserData.languages,
          coderProfileB
        )
      : [];

  if (isCompareMode && secondUserData) {
    // Most Consistent: Peak Streak
    if (initialData.stats.peakStreak > secondUserData.stats.peakStreak) {
      badgesA.push('Most Consistent');
    } else if (secondUserData.stats.peakStreak > initialData.stats.peakStreak) {
      badgesB.push('Most Consistent');
    }

    // Highest Activity: Total Contributions
    if (initialData.stats.totalContributions > secondUserData.stats.totalContributions) {
      badgesA.push('Highest Activity');
    } else if (secondUserData.stats.totalContributions > initialData.stats.totalContributions) {
      badgesB.push('Highest Activity');
    }

    // Strongest Streak: Current Streak
    if (initialData.stats.currentStreak > secondUserData.stats.currentStreak) {
      badgesA.push('Strongest Streak');
    } else if (secondUserData.stats.currentStreak > initialData.stats.currentStreak) {
      badgesB.push('Strongest Streak');
    }
  }

  return (
    <div
      id="dashboard-root"
      data-dashboard
      className="p-4 md:p-6 lg:p-8 min-h-screen relative bg-transparent"
    >
      {/* Top Action Bar */}
      <div
        id="generate-dashboard-btn"
        className="flex justify-between items-center gap-4 mb-6 flex-wrap"
      >
        <div>
          {isCompareMode && secondUserData && (
            <button
              onClick={handleExitCompare}
              className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
            >
              Exit Compare Mode
            </button>
          )}
        </div>
        <div className="flex gap-4 flex-wrap">
          {!isCompareMode && (
            <>
              <button
                onClick={() => setIsOptimizerOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-black dark:bg-[#111] hover:bg-zinc-800 dark:hover:bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:text-white transition-all duration-200 active:scale-[0.98]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
                Profile Optimizer
              </button>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-black dark:bg-[#111] hover:bg-zinc-800 dark:hover:bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:text-white transition-all duration-200 active:scale-[0.98]"
              >
                Compare Profile
              </button>
            </>
          )}
          <RefreshButton username={username} />
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard!');
            }}
            className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <Share2 size={16} />
            Share
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-black dark:bg-black px-4 py-2 text-sm font-semibold text-white dark:text-white transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Generate Your Own
          </Link>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      {!isCompareMode || !secondUserData || !coderProfileB ? (
        /* Standard Single Profile View */
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <aside className="flex flex-col gap-6 lg:row-span-2">
            <ProfileCard
              user={initialData.profile}
              exportData={{
                stats: initialData.stats,
                languages: initialData.languages,
                activity: initialData.activity,
              }}
            />
            <Achievements achievements={initialData.achievements} />
          </aside>

          {/* Main Content */}
          <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
            <section>
              <ActivityLandscape data={initialData.activity} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LanguageChart languages={initialData.languages} />
              <CommitClock data={initialData.commitClock} />
            </section>

            <section>
              <Heatmap data={initialData.activity} />
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <StatsCard
                title="Current Streak"
                value={initialData.stats.currentStreak.toString()}
                description="Days"
                icon="Flame"
                showUTCDisclaimer={true}
                utcDate={new Date().toISOString().split('T')[0]}
              />

              <StatsCard
                title="Peak Streak"
                value={initialData.stats.peakStreak.toString()}
                description="Days"
                icon="TrendingUp"
              />

              <StatsCard
                title="Contributions"
                value={initialData.stats.totalContributions.toString()}
                description="Last Year"
                icon="GitCommit"
              />
            </div>

            <AIInsights insights={initialData.insights} />
          </aside>

          {/* Repository Graph Section */}
          <div className="col-span-1 lg:col-span-2 lg:col-start-2">
            <RepositoryGraph data={initialData.graphData} />
          </div>
        </div>
      ) : (
        /* Compare Mode Split-Dashboard View */
        <div className="flex flex-col gap-8">
          {/* VS Profiles Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="relative">
              <ProfileCard
                user={initialData.profile}
                exportData={{
                  stats: initialData.stats,
                  languages: initialData.languages,
                  activity: initialData.activity,
                }}
                badges={badgesA}
              />
              {/* Personality Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {personalityTagsA.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-lg"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <ProfileCard
                user={secondUserData.profile}
                exportData={{
                  stats: secondUserData.stats,
                  languages: secondUserData.languages,
                  activity: secondUserData.activity,
                }}
                badges={badgesB}
              />
              {/* Personality Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                {personalityTagsB.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-lg"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics comparison cards grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-widest mb-6">
              Head-to-Head Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ComparisonStatsCard
                title="Developer Score"
                valueA={initialData.profile.developerScore}
                valueB={secondUserData.profile.developerScore}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="Award"
              />
              <ComparisonStatsCard
                title="Current Streak"
                valueA={initialData.stats.currentStreak}
                valueB={secondUserData.stats.currentStreak}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="Flame"
              />
              <ComparisonStatsCard
                title="Peak Streak"
                valueA={initialData.stats.peakStreak}
                valueB={secondUserData.stats.peakStreak}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="TrendingUp"
              />
              <ComparisonStatsCard
                title="Contributions (Last Year)"
                valueA={initialData.stats.totalContributions}
                valueB={secondUserData.stats.totalContributions}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="GitCommit"
              />
              <ComparisonStatsCard
                title="Repositories"
                valueA={initialData.profile.stats.repositories}
                valueB={secondUserData.profile.stats.repositories}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="GitBranch"
              />
              <ComparisonStatsCard
                title="Followers"
                valueA={initialData.profile.stats.followers}
                valueB={secondUserData.profile.stats.followers}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="Users"
              />
              <ComparisonStatsCard
                title="Following"
                valueA={initialData.profile.stats.following}
                valueB={secondUserData.profile.stats.following}
                labelA={initialData.profile.name}
                labelB={secondUserData.profile.name}
                icon="UserPlus"
              />
            </div>
          </div>

          {/* Peak Coding Time & Inactivity Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Coding Time Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-5">
                ⏰ Peak Coding Time Analysis
              </h3>
              <div className="grid grid-cols-2 gap-6">
                {/* User A */}
                <div className="flex flex-col">
                  <p className="text-xs text-[#A1A1AA] truncate font-medium mb-2">
                    {initialData.profile.name}
                  </p>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded w-fit mb-3">
                    {coderProfileA.profileName}
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500 dark:text-white/65">
                      Peak Hours:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {coderProfileA.peakHourStart}:00 - {coderProfileA.peakHourEnd}:00
                      </span>
                    </p>
                    <p className="text-gray-500 dark:text-white/65">
                      Active Days:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {coderProfileA.activeWeekdays.join(', ')}
                      </span>
                    </p>
                  </div>
                  {/* Micro Bar Chart */}
                  <div className="w-full h-12 flex items-end gap-px mt-4">
                    {coderProfileA.hourlyDistribution.map((v, h) => (
                      <div
                        key={h}
                        className="flex-1 bg-cyan-500/40 rounded-t-[1px] hover:bg-cyan-500 transition-colors"
                        style={{ height: `${v}%` }}
                        title={`${h}:00 - ${v}% commits`}
                      />
                    ))}
                  </div>
                </div>

                {/* User B */}
                <div className="flex flex-col">
                  <p className="text-xs text-white/65 truncate font-medium mb-2">
                    {secondUserData.profile.name}
                  </p>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded w-fit mb-3">
                    {coderProfileB.profileName}
                  </span>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500 dark:text-white/65">
                      Peak Hours:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {coderProfileB.peakHourStart}:00 - {coderProfileB.peakHourEnd}:00
                      </span>
                    </p>
                    <p className="text-gray-500 dark:text-white/65">
                      Active Days:{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {coderProfileB.activeWeekdays.join(', ')}
                      </span>
                    </p>
                  </div>
                  {/* Micro Bar Chart */}
                  <div className="w-full h-12 flex items-end gap-px mt-4">
                    {coderProfileB.hourlyDistribution.map((v, h) => (
                      <div
                        key={h}
                        className="flex-1 bg-purple-500/40 rounded-t-[1px] hover:bg-purple-500 transition-colors"
                        style={{ height: `${v}%` }}
                        title={`${h}:00 - ${v}% commits`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Inactivity & Consistency Insights */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col justify-between"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-5">
                💀 Inactivity & Recovery Insights
              </h3>
              <div className="space-y-4">
                {/* Longest Inactive Gap */}
                <div className="flex flex-col gap-1.5 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-zinc-400 font-medium">
                      Longest Inactive Period
                    </span>
                    <span className="font-semibold text-[#A1A1AA]">Lower is Better</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-semibold mt-1">
                    <div
                      className={
                        gapA < gapB || gapB === 0
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-white'
                      }
                    >
                      {initialData.profile.name}: {gapA} days {gapA < gapB && '🏆'}
                    </div>
                    <div
                      className={
                        gapB < gapA || gapA === 0
                          ? 'text-emerald-500 dark:text-emerald-400 text-right'
                          : 'text-gray-900 dark:text-white text-right'
                      }
                    >
                      {gapB} days {gapB < gapA && '🏆'} : {secondUserData.profile.name}
                    </div>
                  </div>
                </div>

                {/* Recovery Speed */}
                <div className="flex flex-col gap-1.5 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-zinc-400 font-medium">
                      Consistency Recovery Speed
                    </span>
                    <span className="font-semibold text-[#A1A1AA]">Avg commits/day after gap</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-semibold mt-1">
                    <div
                      className={
                        recoveryA > recoveryB
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-white'
                      }
                    >
                      {initialData.profile.name}: {recoveryA} c/d {recoveryA > recoveryB && '🏆'}
                    </div>
                    <div
                      className={
                        recoveryB > recoveryA
                          ? 'text-emerald-500 dark:text-emerald-400 text-right'
                          : 'text-gray-900 dark:text-white text-right'
                      }
                    >
                      {recoveryB} c/d {recoveryB > recoveryA && '🏆'} :{' '}
                      {secondUserData.profile.name}
                    </div>
                  </div>
                </div>

                {/* Comeback Streak */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-zinc-400 font-medium">
                      Comeback Streak length
                    </span>
                    <span className="font-semibold text-[#A1A1AA]">
                      First streak after longest gap
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-semibold mt-1">
                    <div
                      className={
                        comebackA > comebackB
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-white'
                      }
                    >
                      {initialData.profile.name}: {comebackA} days {comebackA > comebackB && '🏆'}
                    </div>
                    <div
                      className={
                        comebackB > comebackA
                          ? 'text-emerald-500 dark:text-emerald-400 text-right'
                          : 'text-gray-900 dark:text-white text-right'
                      }
                    >
                      {comebackB} days {comebackB > comebackA && '🏆'} :{' '}
                      {secondUserData.profile.name}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Languages Radar Chart comparison */}
          <div className="grid grid-cols-1 gap-6">
            <RadarChart
              languagesA={initialData.languages}
              languagesB={secondUserData.languages}
              labelA={initialData.profile.name}
              labelB={secondUserData.profile.name}
            />
          </div>

          {/* Growth Trend and Commit Battle Timeline */}
          <div className="grid grid-cols-1 gap-6">
            <GrowthTrendChart
              activityA={initialData.activity}
              activityB={secondUserData.activity}
              labelA={initialData.profile.name}
              labelB={secondUserData.profile.name}
            />
          </div>

          {/* Detailed side-by-side components */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold text-center lg:text-left">
                {initialData.profile.name}&apos;s Top Languages
              </h4>
              <LanguageChart languages={initialData.languages} />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold text-center lg:text-right">
                {secondUserData.profile.name}&apos;s Top Languages
              </h4>
              <LanguageChart languages={secondUserData.languages} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold text-center lg:text-left">
                {initialData.profile.name}&apos;s Commit Clock
              </h4>
              <CommitClock data={initialData.commitClock} />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold text-center lg:text-right">
                {secondUserData.profile.name}&apos;s Commit Clock
              </h4>
              <CommitClock data={secondUserData.commitClock} />
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-widest">
                Commit Activity Comparison
              </h3>
            </div>
            <div className="flex flex-col gap-8">
              <div>
                <p className="text-xs text-[#A1A1AA] mb-3 font-semibold">
                  {initialData.profile.name}&apos;s Heatmap
                </p>
                <Heatmap data={initialData.activity} />
              </div>
              <div className="border-t border-black/10 dark:border-white/5 pt-8">
                <p className="text-xs text-[#A1A1AA] mb-3 font-semibold">
                  {secondUserData.profile.name}&apos;s Heatmap
                </p>
                <Heatmap data={secondUserData.activity} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a] shadow-xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 rounded-xl p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-white/65 hover:text-black dark:hover:text-white transition-all"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Compare Profile
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Enter another GitHub username to load their statistics and compare them
                  side-by-side with {initialData.profile.name}.
                </p>
              </div>

              <form onSubmit={handleFetchComparison} className="space-y-4">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    disabled={isLoadingSecond}
                    placeholder="Enter GitHub Username"
                    value={secondUsernameInput}
                    onChange={(e) => setSecondUsernameInput(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-gray-100 px-4 py-3 text-sm text-black outline-none transition-all duration-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111] dark:text-white dark:placeholder:text-white/65"
                  />
                  {secondUsernameInput.length > 0 && !isLoadingSecond && (
                    <button
                      onClick={() => setSecondUsernameInput('')}
                      className="absolute right-3 text-gray-500 hover:text-black dark:text-white/65 dark:hover:text-white"
                      aria-label="Clear input"
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {compareError && (
                  <p className="text-xs text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg leading-relaxed">
                    ⚠️ {compareError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoadingSecond || !secondUsernameInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-black text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingSecond ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Fetching Profile...
                    </>
                  ) : (
                    'Compare'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProfileOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        userData={initialData}
      />
    </div>
  );
}
