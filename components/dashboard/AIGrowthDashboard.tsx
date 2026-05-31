'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BookOpen,
  Terminal,
  CheckCircle2,
  Lock,
  AlertCircle,
  Wrench,
  Info,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { GrowthAnalysisResult } from '@/types/dashboard';
import { analyzeGrowth } from '@/lib/growthAnalyzer';

interface AIGrowthDashboardProps {
  data: {
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
  };
}

export default function AIGrowthDashboard({ data }: AIGrowthDashboardProps) {
  const analysis = analyzeGrowth(data);
  const {
    growthScore,
    growthScoreBreakdown,
    growthTrend,
    consistencyAnalysis,
    productivitySpikes,
    skillInsights,
    personalizedRoadmap,
    aiRecommendations,
    monthlyProgressSummaries,
  } = analysis;

  // State to toggle between Short-Term and Long-Term Goals
  const [activeGoalTab, setActiveGoalTab] = useState<'short' | 'long'>('short');

  // Radial configuration for Growth Score dial
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (growthScore / 100) * circumference;

  // Determine Growth Tier label
  let growthTier = 'Novice Builder';
  let growthColor = 'from-zinc-400 to-zinc-600';
  let growthBg = 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  if (growthScore >= 85) {
    growthTier = 'Elite Master Contributor';
    growthColor = 'from-purple-500 via-pink-500 to-rose-500';
    growthBg = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  } else if (growthScore >= 60) {
    growthTier = 'Rising Star Developer';
    growthColor = 'from-cyan-500 to-blue-600';
    growthBg = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
  } else if (growthScore >= 35) {
    growthTier = 'Active Code Craftsman';
    growthColor = 'from-emerald-400 to-teal-600';
    growthBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
      {/* 1. Hero Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] relative overflow-hidden flex flex-col md:flex-row items-center gap-6 md:gap-8"
      >
        {/* Background Gradients for visuals */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Circular Progress Gauge */}
        <div className="relative shrink-0 flex items-center justify-center w-36 h-36">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-gray-100 dark:stroke-zinc-900"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Foreground Radial Progress */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-purple-500"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0px 0px 6px rgba(168, 85, 247, 0.4))',
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {growthScore}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 font-semibold">
              Growth Score
            </span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${growthBg}`}
            >
              {growthTier}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">AI Assessment Active</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            AI Contributor Growth Insights
          </h2>

          <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xl">
            Welcome to your personalized growth hub. We analyze your commit frequency, coding
            consistency, impact volume, and changes history to formulate your open-source path.
          </p>

          <div className="flex flex-wrap gap-4 mt-2 justify-center md:justify-start">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
              <Flame size={14} className="text-orange-500" />
              <span>
                Current Streak: <strong>{data.stats.currentStreak} days</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
              <Award size={14} className="text-yellow-500" />
              <span>
                Longest Streak: <strong>{data.stats.peakStreak} days</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
              <Target size={14} className="text-cyan-500" />
              <span>
                Total Commits: <strong>{data.stats.totalContributions}</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Growth Breakdown & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
        {/* Left Column: Trend & Spikes */}
        <div className="flex flex-col gap-6">
          {/* Trend & Momentum Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-500" />
                Monthly Momentum
              </h3>
              <div className="flex items-center gap-1.5 text-xs">
                {growthTrend.direction === 'up' && (
                  <span className="text-emerald-500 font-bold flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <TrendingUp size={12} />+{growthTrend.changePercentage}%
                  </span>
                )}
                {growthTrend.direction === 'down' && (
                  <span className="text-rose-500 font-bold flex items-center gap-0.5 bg-rose-500/10 px-2 py-0.5 rounded">
                    <TrendingDown size={12} />
                    {growthTrend.changePercentage}%
                  </span>
                )}
                {growthTrend.direction === 'stable' && (
                  <span className="text-zinc-500 font-bold bg-zinc-500/10 px-2 py-0.5 rounded">
                    Stable
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
              {growthTrend.text}
            </p>

            <div className="border-t border-black/10 dark:border-white/5 pt-4">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                Consistency Analysis
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-3">
                {consistencyAnalysis.description}
              </p>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-black/5 dark:border-white/5">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                    Active Ratio
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {consistencyAnalysis.activeDaysRatio}%
                  </span>
                </div>
                <div className="flex flex-col items-center border-x border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                    Longest Gap
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {consistencyAnalysis.longestActiveGap} days
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">
                    Max Streak
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {consistencyAnalysis.longestStreak} days
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Productivity Spikes Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" />
              Productivity Spikes (Last Year)
            </h3>
            {productivitySpikes.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
                No major spikes detected yet. Focus on committing daily code blocks to establish
                spikes.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {productivitySpikes.map((spike, i) => (
                  <div key={spike.date} className="flex gap-4 items-start relative group">
                    {i !== productivitySpikes.length - 1 && (
                      <div className="absolute left-3 top-6 bottom-[-20px] w-px bg-black/10 dark:bg-white/10" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-zinc-950/40 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {new Date(spike.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                          {spike.count} contributions
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                        {spike.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Growth Score Breakdown Gauge */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Growth Score Breakdown
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
              Factor Weighted Values
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Frequency Progress */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500 dark:text-zinc-400">Frequency (30%)</span>
                <span className="text-gray-900 dark:text-white">
                  {growthScoreBreakdown.frequencyScore}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${growthScoreBreakdown.frequencyScore}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-cyan-500 rounded-full"
                />
              </div>
            </div>

            {/* Consistency Progress */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500 dark:text-zinc-400">Consistency (30%)</span>
                <span className="text-gray-900 dark:text-white">
                  {growthScoreBreakdown.consistencyScore}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${growthScoreBreakdown.consistencyScore}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>

            {/* Volume Progress */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500 dark:text-zinc-400">Volume (20%)</span>
                <span className="text-gray-900 dark:text-white">
                  {growthScoreBreakdown.volumeScore}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${growthScoreBreakdown.volumeScore}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-pink-500 rounded-full"
                />
              </div>
            </div>

            {/* Quality Progress */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500 dark:text-zinc-400">Quality Proxy (20%)</span>
                <span className="text-gray-900 dark:text-white">
                  {growthScoreBreakdown.qualityScore}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${growthScoreBreakdown.qualityScore}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-yellow-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 dark:border-white/5 pt-4 text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed flex gap-2">
            <Info size={14} className="shrink-0 text-purple-400" />
            <span>
              Scores are evaluated relative to open-source project standards. Quality Proxy
              represents average code impact (lines of code change per active day).
            </span>
          </div>
        </motion.div>
      </div>

      {/* 3. Skill & Repository Insights */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen size={16} className="text-purple-500" />
            Developer Profile & Skill Specialization
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
            Core tech stacks & suggested domains
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tech Stack list */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                Detected Tech stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillInsights.detectedTechs.length === 0 ? (
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    None detected. Push commits to start analyzing languages.
                  </span>
                ) : (
                  skillInsights.detectedTechs.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 px-2.5 py-1 rounded-md"
                    >
                      {tech}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                Strongest Impact Areas
              </h4>
              <ul className="flex flex-col gap-1.5">
                {skillInsights.strongestAreas.map((area) => (
                  <li
                    key={area}
                    className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2"
                  >
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Core Suggestions and recommended domains */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Recommended Domains & Issues
            </h4>
            <div className="flex flex-col gap-3">
              {skillInsights.recommendedDomains.map((domain, i) => (
                <div
                  key={domain.name}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-950/40 border border-black/5 dark:border-white/5 flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {domain.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        domain.difficulty === 'Beginner'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : domain.difficulty === 'Intermediate'
                            ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                            : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}
                    >
                      {domain.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal">
                    {domain.description}
                  </p>

                  {/* Suggested Repos */}
                  <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[9px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                      Recommended Repos:
                    </span>
                    {domain.suggestedRepos.map((repo) => (
                      <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-purple-500 dark:text-purple-400 hover:underline flex items-center gap-1 font-mono mt-0.5"
                      >
                        {repo.name}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Contribution Goals & Milestones Roadmap */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        {/* Left Column: Active Goals */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6"
        >
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <Target size={16} className="text-purple-500" />
                Growth Goals Roadmap
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                Target milestones & streak trackers
              </p>
            </div>

            {/* Toggle tabs */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-zinc-950 p-1 border border-black/5 dark:border-white/5 text-[11px] font-semibold">
              <button
                onClick={() => setActiveGoalTab('short')}
                className={`px-3 py-1 rounded-md transition-all ${activeGoalTab === 'short' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Short-Term
              </button>
              <button
                onClick={() => setActiveGoalTab('long')}
                className={`px-3 py-1 rounded-md transition-all ${activeGoalTab === 'long' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Long-Term
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {(activeGoalTab === 'short'
              ? personalizedRoadmap.shortTermGoals
              : personalizedRoadmap.longTermGoals
            ).map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-950/40 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {goal.completed ? (
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-zinc-700 shrink-0" />
                      )}
                      {goal.title}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      {goal.target}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      goal.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : goal.difficulty === 'Medium'
                          ? 'bg-cyan-500/10 text-cyan-500'
                          : 'bg-purple-500/10 text-purple-500'
                    }`}
                  >
                    {goal.difficulty}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${goal.completed ? 'bg-emerald-500' : 'bg-purple-500'}`}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-zinc-400 shrink-0 w-8 text-right">
                    {goal.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Milestones Check grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6"
        >
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Award size={16} className="text-purple-500" />
              Contributor Badges
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
              Completed achievements & milestones
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {personalizedRoadmap.milestones.map((ms) => (
              <div
                key={ms.id}
                className={`p-3 rounded-lg border flex flex-col items-center text-center justify-between gap-2 relative transition-all ${
                  ms.unlocked
                    ? 'bg-gradient-to-br from-white to-purple-500/5 dark:from-[#0a0a0a] dark:to-purple-500/5 border-purple-500/20 text-gray-900 dark:text-white'
                    : 'bg-gray-50/50 dark:bg-zinc-950/20 border-black/5 dark:border-white/5 opacity-50'
                }`}
              >
                {/* Lock icon overlay for locked milestones */}
                {!ms.unlocked && (
                  <div className="absolute top-1.5 right-1.5 text-zinc-600 dark:text-zinc-400">
                    <Lock size={10} />
                  </div>
                )}

                <span
                  className="text-2xl mt-1 select-none"
                  style={{
                    filter: ms.unlocked
                      ? 'drop-shadow(0px 0px 4px rgba(168, 85, 247, 0.4))'
                      : 'none',
                  }}
                >
                  {ms.icon}
                </span>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                    {ms.title}
                  </span>
                  {ms.badgeName && (
                    <span className="text-[8px] text-purple-500 dark:text-purple-400 font-mono mt-0.5 font-bold">
                      {ms.badgeName}
                    </span>
                  )}
                </div>

                <div className="text-[8px] text-gray-400 dark:text-zinc-500 leading-normal max-w-full">
                  {ms.requirement}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 5. AI Recommendations Panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Terminal size={16} className="text-purple-500" />
            AI Target Recommendations
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
            Optimized pathways and action plans
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
          {/* Action Ratings */}
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-purple-400" />
                Issue Difficulty Suggestion
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-black/5 dark:border-white/5">
                <strong>Recommended Level: {aiRecommendations.difficultyLevel}</strong> —{' '}
                {aiRecommendations.difficultyReason}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                Suggested Contribution Categories
              </h4>
              <div className="flex flex-col gap-3">
                {aiRecommendations.categoryRatings.map((rating) => (
                  <div key={rating.category} className="flex gap-4 items-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 w-24 shrink-0">
                      {rating.category}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-950 border border-black/5 dark:border-white/5 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rating.score}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-white w-8 text-right shrink-0">
                      {rating.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Tips */}
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wrench size={13} />
              Personalized Action Tips
            </h4>
            <div className="flex flex-col gap-3">
              {aiRecommendations.improvementSuggestions.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex gap-2.5 items-start text-xs text-gray-600 dark:text-zinc-300 leading-relaxed border-b border-purple-500/5 pb-2.5 last:border-0 last:pb-0"
                >
                  <ChevronRight size={14} className="text-purple-400 mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Timeline Monthly Summaries */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar size={16} className="text-purple-500" />
            Monthly Coding Summary Timeline
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
            Month-over-month progress summaries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthlyProgressSummaries.map((summary, idx) => (
            <div
              key={summary.month}
              className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-950/40 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-all flex flex-col gap-2"
            >
              <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {summary.month}
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                  {summary.contributions} contributions
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mt-1">
                {summary.summary}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
