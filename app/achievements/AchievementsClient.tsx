'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Sparkles, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type {
  AchievementsResponse,
  AchievementCategory,
  AchievementRarity,
  AchievementTier,
  AchievementData,
} from '@/types/achievements';
import {
  ACHIEVEMENT_RARITY_COLORS,
  ACHIEVEMENT_TIER_LABELS,
  ACHIEVEMENT_TIER_COLORS,
} from '@/types/achievements';
import { consumeUnlockCelebration } from './celebration';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 30, stiffness: 60 });
  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString()}${suffix}`);
  return <motion.span>{display}</motion.span>;
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div
      className={`relative h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10 ${className}`}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] p-5">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl shimmer border border-white/10" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 rounded shimmer" />
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-2 w-full rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 rounded shimmer border border-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: AchievementRarity }) {
  const colors = ACHIEVEMENT_RARITY_COLORS[rarity];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        border: '1px solid',
      }}
    >
      {rarity}
    </span>
  );
}

function TierBadge({ tier }: { tier: AchievementTier | null }) {
  if (!tier) return null;
  const color = ACHIEVEMENT_TIER_COLORS[tier];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: `rgb(${color} / 0.12)`,
        color: `rgb(${color})`,
        border: `1px solid rgb(${color} / 0.3)`,
      }}
    >
      {ACHIEVEMENT_TIER_LABELS[tier]}
    </span>
  );
}

function AchievementCard({ data, index }: { data: AchievementData; index: number }) {
  const { def, state } = data;
  const isUnlocked = state.unlocked;
  const currentTier = state.currentTier;
  const progress = state.progress;
  const label = def.measureLabel.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
    >
      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-black/60 transition-all duration-300">
          {def.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm font-bold">{def.name}</h3>
            {currentTier && <TierBadge tier={currentTier} />}
            <RarityBadge rarity={def.rarity} />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[12px] text-gray-500 dark:text-white/50">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              +{state.xpEarned}
            </span>{' '}
            XP
          </div>
          {isUnlocked && (
            <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">Unlocked</div>
          )}
          {!isUnlocked && (
            <div className="mt-1 text-[10px] text-white/30">
              <Lock size={12} className="inline" /> Locked
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-3 text-xs text-foreground">{def.description}</p>

        {!isUnlocked && state.nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-500 dark:text-white/50">
              <p className="text-[12px]">{label}</p>
              <div className="text-[12px]">
                <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                  {state.currentValue.toLocaleString()}
                </span>
                /{state.nextTier.threshold.toLocaleString()}
              </div>
            </div>
            <ProgressBar value={progress} />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-zinc-400 dark:text-[#777]">
                {(state.nextTier.threshold - state.currentValue).toLocaleString()}{' '}
                {def.measureLabel} remaining
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{progress}%</p>
            </div>
          </div>
        )}

        {isUnlocked && state.nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-500 dark:text-white/50">
              <p className="text-[12px]">{label}</p>
              <div className="text-[12px]">
                <span className="text-[14px] font-bold text-gray-900 dark:text-white">
                  {state.currentValue.toLocaleString()}
                </span>
                /{state.nextTier.threshold.toLocaleString()}
              </div>
            </div>
            <ProgressBar value={progress} />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-zinc-400 dark:text-[#777]">
                {(state.nextTier.threshold - state.currentValue).toLocaleString()} to next tier
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{progress}%</p>
            </div>
          </div>
        )}

        {isUnlocked && !state.nextTier && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">MAXED</span>
            <span className="text-[#A1A1AA]">|</span>
            <span className="text-gray-500 dark:text-white/50">
              {state.currentValue.toLocaleString()} {def.measureLabel}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function UnlockCelebration({
  data,
  onClose,
}: {
  data: AchievementData | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Defer focus to the next frame so it runs after the dialog has mounted and
    // painted (the dialog animates in), rather than during the same commit.
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [data, onClose]);
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        style: {
          background: `hsl(${i * 36}, 80%, 60%)`,
          left: `${(i * 17 + 31) % 100}%`,
          top: `${(i * 43 + 13) % 100}%`,
        },
        animate: {
          y: [0, -60 - ((i * 37 + 7) % 80), 0],
          opacity: [1, 1, 0],
          scale: [0, 1.5, 0],
        },
        transition: {
          duration: 1.5 + ((i * 19) % 100) / 100,
          delay: (((i * 23 + 11) % 100) / 100) * 0.3,
          ease: 'easeOut' as const,
        },
      })),
    []
  );

  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="achievement-unlock-title"
          tabIndex={-1}
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative mx-4 max-w-md rounded-3xl border border-white/20 bg-gradient-to-b from-white/10 to-white/5 p-8 text-center backdrop-blur-2xl focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti-like particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={p.style}
              initial={{ y: 0, opacity: 1, scale: 0 }}
              animate={p.animate}
              transition={p.transition}
            />
          ))}

          <motion.div
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl text-5xl"
            style={{
              background: `linear-gradient(135deg, ${ACHIEVEMENT_TIER_COLORS[data.state.currentTier ?? 'bronze']}40, rgba(255,255,255,0.05))`,
              border: `2px solid ${ACHIEVEMENT_TIER_COLORS[data.state.currentTier ?? 'bronze']}60`,
              boxShadow: `0 0 60px ${ACHIEVEMENT_TIER_COLORS[data.state.currentTier ?? 'bronze']}30`,
            }}
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {data.def.icon}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            id="achievement-unlock-title"
            className="mb-1 text-2xl font-bold text-white"
          >
            Achievement Unlocked!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-lg font-semibold text-white/80"
          >
            {data.def.name}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            {data.state.currentTier && <TierBadge tier={data.state.currentTier} />}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-6 py-2 text-emerald-400"
          >
            <Sparkles size={16} />
            <span className="font-bold">+{data.state.xpEarned} XP</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={onClose}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AchievementsClient() {
  const [inputValue, setInputValue] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('username') || '';
    }
    return '';
  });
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | null>(null);
  const [celebrated, setCelebrated] = useState<AchievementData | null>(null);

  // Local Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const fetchAchievements = useCallback(async (user: string) => {
    setLoading(true);
    setError(null);
    setSearchQuery('');
    setStatusFilter('all');
    try {
      const res = await fetch(`/api/achievements?username=${encodeURIComponent(user)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json: AchievementsResponse = await res.json();
      setData(json);

      const toCelebrate = consumeUnlockCelebration(user, json.recentUnlocks);
      if (toCelebrate) setCelebrated(toCelebrate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter achievements per category and dynamically calculate counts
  const filteredCategories = useMemo(() => {
    if (!data) return [];

    return data.categories.map((cat) => {
      const filteredAchievements = cat.achievements.filter((ach) => {
        // Text Search (match name or description)
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          ach.def.name.toLowerCase().includes(query) ||
          ach.def.description.toLowerCase().includes(query);

        // Status Filter
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'unlocked' && ach.state.unlocked) ||
          (statusFilter === 'locked' && !ach.state.unlocked);

        return matchesSearch && matchesStatus;
      });

      const unlockedCount = filteredAchievements.filter((ach) => ach.state.unlocked).length;

      return {
        ...cat,
        achievements: filteredAchievements,
        unlockedCount,
        totalCount: filteredAchievements.length,
      };
    });
  }, [data, searchQuery, statusFilter]);

  const hasFilteredAchievements = useMemo(() => {
    return filteredCategories
      .filter((cat) => !activeCategory || cat.category === activeCategory)
      .some((cat) => cat.achievements.length > 0);
  }, [filteredCategories, activeCategory]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('username');
    if (u) {
      const id = setTimeout(() => fetchAchievements(u), 0);
      return () => clearTimeout(id);
    }
  }, [fetchAchievements]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set('username', inputValue.trim());
      window.history.replaceState({}, '', url.toString());
      fetchAchievements(inputValue.trim());
    }
  };

  const showEmptyState = !data && !loading && !error;

  const renderSearchSection = (large = false) => (
    <div className={`${large ? 'py-16' : ''}`}>
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-4xl"
          >
            🏆
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Developer Achievements</h1>
          <p className="mt-2 text-sm text-white/40">
            Enter a GitHub username to see their achievements
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            aria-label="Search GitHub username"
            placeholder="e.g. jhasourav07"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-white/30 backdrop-blur-xl transition-all duration-300 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 animate-pulse">
            <div className="mx-auto mb-4 h-8 w-64 rounded shimmer border border-white/10" />
            <div className="mx-auto h-4 w-96 rounded shimmer border border-white/10" />
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] p-6"
              >
                <div className="mb-2 h-3 w-20 rounded shimmer border border-white/10" />
                <div className="h-8 w-28 rounded shimmer border border-white/10" />
              </div>
            ))}
          </div>
          <CategorySkeleton />
          <div className="mt-5"></div>
          <CategorySkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent selection:bg-cyan-500/30 text-gray-900 dark:text-white font-sans">
      {celebrated && <UnlockCelebration data={celebrated} onClose={() => setCelebrated(null)} />}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-black/60 text-gray-900 dark:text-white transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-900"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">🏆 Achievements</h1>
              {data && (
                <p className="text-sm text-[#A1A1AA]">{data.profile.name || data.profile.login}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label="Search GitHub username"
              placeholder="Search user..."
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/60 py-2.5 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 focus:border-transparent outline-none focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
            />
          </form>
        </div>

        {showEmptyState && renderSearchSection(true)}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h2 className="mb-2 text-xl font-bold text-white">Something went wrong</h2>
            <p className="mb-6 max-w-md text-sm text-white/40">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setData(null);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="min-h-screen bg-transparent px-4 py-8 sm:px-6">
            <div className="mb-8 animate-pulse">
              <div className="mx-auto mb-4 h-8 w-64 rounded shimmer border border-white/10" />
              <div className="mx-auto h-4 w-96 rounded shimmer border border-white/10" />
            </div>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] p-6"
                >
                  <div className="mb-2 h-3 w-20 rounded shimmer border border-white/10" />
                  <div className="h-8 w-28 rounded shimmer border border-white/10" />
                </div>
              ))}
            </div>
            <CategorySkeleton />
            <div className="mt-5"></div>
            <CategorySkeleton />
          </div>
        )}

        {data && !loading && (
          <>
            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-8 overflow-hidden rounded-3xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] p-6 sm:p-8"
            >
              <div className="relative">
                <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 text-4xl">
                    <Trophy size={36} className="text-emerald-500" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold">
                      Developer Level {data.overview.developerLevel}
                    </h2>
                    <p className="text-sm text-[#A1A1AA]">
                      <span className="font-semibold text-emerald-400">
                        <AnimatedCounter value={data.overview.totalXp} />
                      </span>{' '}
                      XP total
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-900 dark:text-white">
                      Progress to Level {data.overview.developerLevel + 1}
                    </span>
                    <span className="text-[#A1A1AA]">{data.overview.levelProgress}%</span>
                  </div>
                  <ProgressBar value={data.overview.levelProgress} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.06)] bg-gray-50/50 dark:bg-neutral-900/30 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      <AnimatedCounter
                        value={data.overview.unlockedCount}
                        suffix={` / ${data.overview.totalAchievements}`}
                      />
                    </div>
                    <div className="mt-1 text-xs text-[#A1A1AA]">Achievements</div>
                  </div>
                  <div className="rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.06)] bg-gray-50/50 dark:bg-neutral-900/30 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      <AnimatedCounter value={data.overview.completionPercent} suffix="%" />
                    </div>
                    <div className="mt-1 text-xs text-[#A1A1AA]">Completion</div>
                  </div>
                  <div className="rounded-2xl border border-black/10 dark:border-[rgba(255,255,255,0.06)] bg-gray-50/50 dark:bg-neutral-900/30 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      <Trophy size={20} /> Lvl {data.overview.developerLevel}
                    </div>
                    <div className="mt-1 text-xs text-[#A1A1AA]">Developer Level</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search and Status Filters */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Local Achievements Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search achievements"
                  placeholder="Search achievements by name or description..."
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/60 py-2.5 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 focus:border-transparent outline-none focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-inner"
                />
              </div>

              {/* Status Tabs */}
              <div className=" relative flex rounded-xl bg-white/50 dark:bg-zinc-900/50 p-1 border border-black/10 dark:border-white/10 self-start sm:self-auto shadow-sm backdrop-blur-sm">
                {(['all', 'unlocked', 'locked'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`relative rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                      statusFilter === filter
                        ? 'z-10 font-bold text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {statusFilter === filter && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-800"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-20">{filter}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Navigation */}
            <div className="mb-8 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-xl border px-4 py-2 text-xs font-medium transition-all ${
                  activeCategory === null
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#111] hover:bg-zinc-800 dark:hover:bg-zinc-900 text-gray-900 dark:text-white'
                }`}
              >
                All
              </button>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() =>
                    setActiveCategory(cat.category === activeCategory ? null : cat.category)
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition-all ${
                    activeCategory === cat.category
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-white dark:bg-[#111] hover:bg-zinc-800 dark:hover:bg-zinc-900 text-gray-900 dark:text-white'
                  }`}
                >
                  {cat.icon} {cat.label}
                  <span
                    className={`ml-1 rounded-md  ${activeCategory === cat.category ? 'bg-emerald-500/20' : 'bg-gray-100 dark:bg-white/10'} px-1.5 py-0.5 text-[10px]`}
                  >
                    {cat.unlockedCount}/{cat.totalCount}
                  </span>
                </button>
              ))}
            </div>

            {/* Achievement Categories */}
            {hasFilteredAchievements ? (
              filteredCategories
                .filter((cat) => !activeCategory || cat.category === activeCategory)
                .filter((cat) => cat.achievements.length > 0)
                .map((category, ci) => (
                  <motion.section
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.1 }}
                    className="mb-10"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {category.label}
                      </h2>
                      <span className="text-xs text-[#A1A1AA]">
                        {category.unlockedCount} / {category.totalCount}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {category.achievements.map((ach, i) => (
                        <AchievementCard key={ach.def.id} data={ach} index={i} />
                      ))}
                    </div>
                  </motion.section>
                ))
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="mb-4 text-5xl">🔍</div>
                <h3 className="mb-2 text-lg font-bold text-white">
                  No achievements match your criteria
                </h3>
                <p className="mb-6 max-w-sm text-sm text-white/40">
                  Try adjusting your text search or status filter to find achievements.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}

            <div className="mt-12 text-center text-xs text-white/20">
              Achievements calculated from real-time GitHub data
            </div>
          </>
        )}
      </div>
    </div>
  );
}
