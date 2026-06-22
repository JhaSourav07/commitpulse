'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DashboardSkeleton from './DashboardSkeleton';
import { X } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { DashboardPeriod } from '@/utils/dashboardPeriod';
import type { DashboardData, RepoActivityInfo, Repository } from '@/types/dashboard';

import ProfileCard from './ProfileCard';
import Achievements from './Achievements';
import ActivityLandscape from './ActivityLandscape';
import LanguageChart from './LanguageChart';
import CommitClock from './CommitClock';
import HistoricalTrendView from './HistoricalTrendView';
import AIInsights from './AIInsights';
import StatsCard from './StatsCard';
import RepositoryGraph from './RepositoryGraph';
import HallOfFame from './HallOfFame';
import ComparisonStatsCard from './ComparisonStatsCard';
import RadarChart from './RadarChart';
import GrowthTrendChart from './GrowthTrendChart';
import InactiveRepoReminder from './InactiveRepoReminder';
import DeploymentTracker from './DeploymentTracker';
import ArchitectureVisualizer from './ArchitectureVisualizer';
import ResumeProfileSection from './ResumeProfileSection';
import { PopularRepos } from './PopularPinnnedRepos';
import GoalTracker from './GoalTracker';

import RepositoryImpactAnalyzer from './RepositoryImpactAnalyzer';
import ContributionForecast from './ContributionForecast';

export type { DashboardData } from '@/types/dashboard';

export interface ProfileMetrics {
  currentStreak: number;
  commitClock: { day: string; commits: number }[]; // e.g., Sun-Sat daily totals
}

export interface CoderProfile {
  peakHourStart: number;
  peakHourEnd: number;
  profileName: 'Early Builder ☀' | 'Weekend Warrior 🚀' | 'Consistent Runner 🏃‍♂️';
  hourlyDistribution: number[];
  activeWeekdays: string[];
}

/**
 * Generates a coder profile based on available metrics.
 */
export function generateCoderProfile(metrics: ProfileMetrics): CoderProfile {
  const { currentStreak, commitClock } = metrics;

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

  // 2. Determine Final Profile Type
  if (currentStreak >= 10) {
    profileName = 'Consistent Runner 🏃‍♂️';
  } else if (isWeekendWarrior) {
    profileName = 'Weekend Warrior 🚀';
  }

  // 3. Populate UI properties based on the derived profile.
  let peakHourStart = 9;
  let peakHourEnd = 17;
  let hourlyDistribution = new Array(24).fill(0);
  let activeWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  if (profileName === 'Early Builder ☀') {
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

interface DashboardClientProps {
  initialData: DashboardData;
  allRepoActivity?: RepoActivityInfo[];
  username: string;
  compareData?: DashboardData | null;
  period: DashboardPeriod;
}

export default function DashboardClient({
  initialData,
  allRepoActivity = [],
  username,
  compareData = null,
  period,
}: DashboardClientProps) {
  const { t } = useTranslation();
  const [secondUserData, setSecondUserData] = useState<DashboardData | null>(compareData);
  const [activeTab, setActiveTab] = useState<'overview' | 'pr-insights' | 'ci-analytics'>(
    'overview'
  );
  const [isCompareMode, setIsCompareMode] = useState(Boolean(compareData));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [secondUsernameInput, setSecondUsernameInput] = useState('');
  const [isLoadingSecond, setIsLoadingSecond] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const compareInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const allRepos = [
    ...(initialData.popularRepos || []),
    ...(initialData.pinnedRepos || []),
    ...(initialData.starredRepos || []),
  ];
  const deduplicatedRepos = Array.from(new Map(allRepos.map((repo) => [repo.name, repo])).values());

  const compareUser1 = {
    profile: initialData.profile,
    stats: initialData.stats,
    languages: initialData.languages,
    activity: initialData.activity,
    achievements: initialData.achievements,
    popularRepos: deduplicatedRepos,
  };

  const compareUser2 = secondUserData
    ? {
        profile: secondUserData.profile,
        stats: secondUserData.stats,
        languages: secondUserData.languages,
        activity: secondUserData.activity,
        achievements: secondUserData.achievements,
        popularRepos: [
          ...(secondUserData.popularRepos || []),
          ...(secondUserData.pinnedRepos || []),
          ...(secondUserData.starredRepos || []),
        ].reduce((acc: Repository[], repo) => {
          if (!acc.some((r) => r.name === repo.name)) {
            acc.push(repo);
          }
          return acc;
        }, []),
      }
    : null;

  return (
    <div className="space-y-6">
      {!isCompareMode || !secondUserData ? (
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr_320px] lg:gap-8">
          <aside className="space-y-6">
            <ProfileCard
              user={initialData.profile}
              exportData={{
                stats: initialData.stats,
                languages: initialData.languages,
                activity: initialData.activity,
              }}
            />
            <Achievements achievements={initialData.achievements} />
            <ResumeProfileSection githubUsername={username} />
            <DeploymentTracker data={initialData.deployments} />
          </aside>

          <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
            <section>
              <ActivityLandscape data={initialData.activity} />
            </section>

            <section>
              <GoalTracker username={username} activity={initialData.activity} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LanguageChart languages={initialData.languages} />
              <CommitClock data={initialData.commitClock} />
            </section>

            <section>
              <HistoricalTrendView
                activity={initialData.activity}
                username={username}
                period={period}
              />
            </section>

            <section>
              <RepositoryImpactAnalyzer repositories={deduplicatedRepos} />
            </section>
          </div>

          <aside className="space-y-6">
            <div className="space-y-4">
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
                description={period.label}
                icon="GitCommit"
              />
            </div>
            <AIInsights insights={initialData.insights} />

            <ContributionForecast
              activity={initialData.activity}
              totalContributions={initialData.stats.totalContributions}
            />

            <PopularRepos
              popularRepos={initialData.popularRepos || []}
              pinnedRepos={initialData.pinnedRepos || []}
              starredRepos={initialData.starredRepos || []}
            />
            <InactiveRepoReminder repos={allRepoActivity} />
          </aside>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileCard
              user={initialData.profile}
              exportData={{
                stats: initialData.stats,
                languages: initialData.languages,
                activity: initialData.activity,
              }}
            />
            <ProfileCard
              user={secondUserData.profile}
              exportData={{
                stats: secondUserData.stats,
                languages: secondUserData.languages,
                activity: secondUserData.activity,
              }}
            />
          </div>


        </div>
      )}

      <div className="col-span-1 lg:col-span-3">
        <RepositoryGraph data={initialData.graphData} />
        <HallOfFame data={initialData.hallOfFame} />
      </div>
    </div>
  );
}
