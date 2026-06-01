'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Swords,
  Flame,
  TrendingUp,
  GitCommit,
  Star,
  Users,
  GitBranch,
  MapPin,
  Calendar,
  Trophy,
  Loader2,
} from 'lucide-react';

/* ── types ────────────────────────────────────────────────────────────── */

interface UserProfile {
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

interface UserStats {
  currentStreak: number;
  peakStreak: number;
  totalContributions: number;
}

interface LanguageData {
  name: string;
  color: string;
  percentage: number;
}

interface ActivityData {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

interface CompareUserData {
  profile: UserProfile;
  stats: UserStats;
  languages: LanguageData[];
  activity: ActivityData[];
}

interface CompareResponse {
  user1: CompareUserData;
  user2: CompareUserData;
  error?: string;
}

/* ── helper: mini heatmap ─────────────────────────────────────────────── */

const INTENSITY_COLORS = [
  'bg-zinc-800',
  'bg-emerald-900',
  'bg-emerald-700',
  'bg-emerald-500',
  'bg-emerald-400',
];

function MiniHeatmap({ activity }: { activity: ActivityData[] }) {
  const recent = activity.slice(-91); // last ~13 weeks
  return (
    <div className="flex flex-wrap gap-[2px]">
      {recent.map((day, i) => (
        <div
          key={i}
          title={`${day.date}: ${day.count} contributions`}
          className={`w-[10px] h-[10px] rounded-[2px] ${INTENSITY_COLORS[day.intensity]} transition-colors`}
        />
      ))}
    </div>
  );
}

/* ── helper: stat comparison card ─────────────────────────────────────── */

function StatBattle({
  label,
  icon: Icon,
  valueA,
  valueB,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  valueA: number;
  valueB: number;
}) {
  const total = valueA + valueB;
  const pctA = total > 0 ? (valueA / total) * 100 : 50;
  const winnerA = valueA > valueB;
  const winnerB = valueB > valueA;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-5 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-[#A1A1AA]" />
        <span className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium">
          {label}
        </span>
      </div>
      <div className="flex justify-between items-end mb-3">
        <div className="text-left">
          <span
            className={`text-2xl font-bold tracking-tight ${
              winnerA ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
            }`}
          >
            {valueA.toLocaleString()}
          </span>
          {winnerA && (
            <span className="ml-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide">
              ★
            </span>
          )}
        </div>
        <div className="text-right">
          {winnerB && (
            <span className="mr-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wide">
              ★
            </span>
          )}
          <span
            className={`text-2xl font-bold tracking-tight ${
              winnerB ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
            }`}
          >
            {valueB.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden flex border border-black/5 dark:border-[rgba(255,255,255,0.04)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctA}%` }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-l-full ${
            winnerA
              ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'bg-zinc-400 dark:bg-zinc-600'
          }`}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${100 - pctA}%` }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-r-full ${
            winnerB
              ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'bg-zinc-400 dark:bg-zinc-600'
          }`}
        />
      </div>
    </motion.div>
  );
}

/* ── helper: profile card ─────────────────────────────────────────────── */

function CompareProfileCard({
  profile,
  stats,
  side,
}: {
  profile: UserProfile;
  stats: UserStats;
  side: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: side === 'left' ? 0 : 0.1 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-black/10 dark:border-[rgba(255,255,255,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${profile.avatarUrl}${profile.avatarUrl.includes('?') ? '&' : '?'}s=120`}
              alt={profile.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          {profile.isPro && (
            <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-full">
              PRO
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
          {profile.name}
        </h3>
        <p className="text-sm text-[#A1A1AA] mb-3">@{profile.username}</p>
        <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4 max-w-[200px] line-clamp-2">
          {profile.bio}
        </p>

        {/* Meta */}
        <div className="flex gap-4 mb-4 text-[#A1A1AA] text-xs">
          <div className="flex items-center gap-1">
            <MapPin size={11} />
            <span>{profile.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={11} />
            <span>{profile.joinedDate}</span>
          </div>
        </div>

        {/* Developer Score */}
        <div className="w-full border border-black/10 dark:border-[rgba(255,255,255,0.06)] rounded-lg p-3 mb-4 bg-gray-100 dark:bg-[#111]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-medium text-[#A1A1AA] uppercase tracking-widest">
              Dev Score
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {profile.developerScore}
            </span>
          </div>
          <div className="w-full h-1 bg-gray-300 dark:bg-[rgba(255,255,255,0.07)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${profile.developerScore}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="h-full bg-black dark:bg-white rounded-full"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 w-full">
          {[
            { icon: GitBranch, label: 'Repos', value: profile.stats.repositories },
            { icon: Star, label: 'Stars', value: profile.stats.stars },
            { icon: Users, label: 'Followers', value: profile.stats.followers },
            { icon: Flame, label: 'Streak', value: stats.currentStreak },
          ].map(({ icon: Ic, label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center py-2 px-1 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.06)]"
            >
              <Ic size={12} className="text-[#A1A1AA] mb-1" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
              <span className="text-[8px] text-[#A1A1AA] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── helper: language comparison ──────────────────────────────────────── */

function LanguageComparison({
  langsA,
  langsB,
  nameA,
  nameB,
}: {
  langsA: LanguageData[];
  langsB: LanguageData[];
  nameA: string;
  nameB: string;
}) {
  const allLangs = new Set([...langsA.map((l) => l.name), ...langsB.map((l) => l.name)]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
    >
      <h3 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-5">
        Language Breakdown
      </h3>
      <div className="space-y-3">
        {Array.from(allLangs)
          .slice(0, 6)
          .map((lang) => {
            const a = langsA.find((l) => l.name === lang);
            const b = langsB.find((l) => l.name === lang);
            const pA = a?.percentage ?? 0;
            const pB = b?.percentage ?? 0;
            const color = a?.color || b?.color || '#a855f7';

            return (
              <div key={lang}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#A1A1AA]">
                    {nameA}: {pA}%
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{lang}</span>
                  <span className="text-[#A1A1AA]">
                    {nameB}: {pB}%
                  </span>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="flex-1 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden flex justify-end">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pA}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color, opacity: 0.8 }}
                    />
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pB}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
}

/* ── helper: loading skeleton ─────────────────────────────────────────── */

function CompareSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-zinc-800 mb-4" />
              <div className="w-32 h-5 bg-gray-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-800 rounded mb-4" />
              <div className="w-full h-16 bg-gray-200 dark:bg-zinc-800 rounded-lg mb-4" />
              <div className="grid grid-cols-2 gap-2 w-full">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────── */

export default function CompareClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user1, setUser1] = useState(searchParams.get('user1') || '');
  const [user2, setUser2] = useState(searchParams.get('user2') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<CompareResponse | null>(null);

  const BASE_URL =
    typeof window !== 'undefined' ? window.location.origin : 'https://commitpulse.vercel.app';

  const handleCompare = useCallback(
    async (u1: string, u2: string) => {
      if (!u1.trim() || !u2.trim()) {
        setError('Please enter both usernames.');
        return;
      }
      setLoading(true);
      setError('');
      setData(null);

      // Update URL for shareability
      router.replace(`/compare?user1=${encodeURIComponent(u1)}&user2=${encodeURIComponent(u2)}`, {
        scroll: false,
      });

      try {
        const res = await fetch(
          `/api/compare?user1=${encodeURIComponent(u1)}&user2=${encodeURIComponent(u2)}`
        );
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to fetch comparison data.');
          return;
        }

        setData(json);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Auto-compare if URL has params on mount
  useEffect(() => {
    const u1 = searchParams.get('user1');
    const u2 = searchParams.get('user2');
    if (u1 && u2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleCompare(u1, u2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d1 = data?.user1;
  const d2 = data?.user2;

  // Compute winner summary
  let winner = '';
  if (d1 && d2) {
    let scoreA = 0;
    let scoreB = 0;
    const battles = [
      [d1.stats.totalContributions, d2.stats.totalContributions],
      [d1.stats.currentStreak, d2.stats.currentStreak],
      [d1.stats.peakStreak, d2.stats.peakStreak],
      [d1.profile.stats.repositories, d2.profile.stats.repositories],
      [d1.profile.stats.stars, d2.profile.stats.stars],
      [d1.profile.stats.followers, d2.profile.stats.followers],
    ];
    battles.forEach(([a, b]) => {
      if (a > b) scoreA++;
      else if (b > a) scoreB++;
    });
    if (scoreA > scoreB) winner = d1.profile.username;
    else if (scoreB > scoreA) winner = d2.profile.username;
    else winner = 'tie';
  }

  return (
    <main className="min-h-screen pt-28 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#111] mb-4">
            <Swords size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-widest">
              Developer Showdown
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            Compare Developers
          </h1>
          <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
            Put two GitHub profiles head-to-head. Streaks, contributions, languages — who comes out
            on top?
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
              />
              <input
                id="compare-user1-input"
                type="text"
                placeholder="GitHub username #1"
                value={user1}
                onChange={(e) => setUser1(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompare(user1, user2)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div className="flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-500 tracking-widest">VS</span>
            </div>

            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
              />
              <input
                id="compare-user2-input"
                type="text"
                placeholder="GitHub username #2"
                value={user2}
                onChange={(e) => setUser2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompare(user1, user2)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <motion.button
              id="compare-submit-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCompare(user1, user2)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
              {loading ? 'Comparing...' : 'Compare'}
            </motion.button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-center"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && <CompareSkeleton />}

        {/* Results */}
        <AnimatePresence>
          {d1 && d2 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Winner Banner */}
              {winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trophy size={18} className="text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {winner === 'tie'
                        ? "It's a Tie! Both developers are evenly matched."
                        : `@${winner} wins the showdown!`}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Profile Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <CompareProfileCard profile={d1.profile} stats={d1.stats} side="left" />

                {/* VS Divider */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0a0a] border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <span className="text-xs font-bold text-emerald-500 tracking-wider">VS</span>
                  </div>
                </div>

                <CompareProfileCard profile={d2.profile} stats={d2.stats} side="right" />
              </div>

              {/* Stats Battle Grid */}
              <div>
                <h2 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-4">
                  Stats Showdown
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatBattle
                    label="Current Streak"
                    icon={Flame}
                    valueA={d1.stats.currentStreak}
                    valueB={d2.stats.currentStreak}
                  />
                  <StatBattle
                    label="Peak Streak"
                    icon={TrendingUp}
                    valueA={d1.stats.peakStreak}
                    valueB={d2.stats.peakStreak}
                  />
                  <StatBattle
                    label="Total Contributions"
                    icon={GitCommit}
                    valueA={d1.stats.totalContributions}
                    valueB={d2.stats.totalContributions}
                  />
                  <StatBattle
                    label="Repositories"
                    icon={GitBranch}
                    valueA={d1.profile.stats.repositories}
                    valueB={d2.profile.stats.repositories}
                  />
                  <StatBattle
                    label="Stars"
                    icon={Star}
                    valueA={d1.profile.stats.stars}
                    valueB={d2.profile.stats.stars}
                  />
                  <StatBattle
                    label="Followers"
                    icon={Users}
                    valueA={d1.profile.stats.followers}
                    valueB={d2.profile.stats.followers}
                  />
                </div>
              </div>

              {/* Language Comparison */}
              <LanguageComparison
                langsA={d1.languages}
                langsB={d2.languages}
                nameA={d1.profile.username}
                nameB={d2.profile.username}
              />

              {/* Activity Heatmaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { user: d1, side: 'left' as const },
                  { user: d2, side: 'right' as const },
                ].map(({ user, side }) => (
                  <motion.div
                    key={side}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-5 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
                  >
                    <h3 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-3">
                      {user.profile.username}&apos;s Activity (Last 13 Weeks)
                    </h3>
                    <MiniHeatmap activity={user.activity} />
                  </motion.div>
                ))}
              </div>

              {/* 3D Monolith Embeds */}
              <div>
                <h2 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-4">
                  3D Monolith Comparison
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[d1, d2].map((user) => (
                    <motion.div
                      key={user.profile.username}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="rounded-xl overflow-hidden border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a]"
                    >
                      <div className="p-3 border-b border-black/5 dark:border-white/5">
                        <span className="text-xs font-medium text-[#A1A1AA]">
                          @{user.profile.username}
                        </span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${BASE_URL}/api/streak?user=${encodeURIComponent(user.profile.username)}&theme=neon`}
                        alt={`${user.profile.username}'s CommitPulse monolith`}
                        className="w-full"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
