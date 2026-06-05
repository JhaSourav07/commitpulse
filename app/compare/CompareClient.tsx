'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopRivalriesTicker from '@/components/TopRivalriesTicker';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
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
  Moon,
  Sun,
  Coffee,
  Plus,
  Minus,
  Code2,
  GitPullRequest,
  CircleDot,
  Cpu,
  RefreshCw,
  Component,
  Users as UsersIcon,
  CalendarDays,
  Tent,
  Camera,
  Share2,
} from 'lucide-react';
import html2canvas from 'html2canvas';

/* ── types ────────────────────────────────────────────────────────────── */

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

export interface UserStats {
  currentStreak: number;
  peakStreak: number;
  totalContributions: number;
  codingHabit?: string;
  totalPRs?: number;
  totalIssues?: number;
}

export interface LanguageData {
  name: string;
  color: string;
  percentage: number;
}

export interface ActivityData {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  locAdditions?: number;
  locDeletions?: number;
}

export interface CompareUserData {
  profile: UserProfile;
  stats: UserStats;
  languages: LanguageData[];
  activity: ActivityData[];
}

export interface CompareResponse {
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

/* ── helper: developer persona ────────────────────────────────────────── */

function getDeveloperPersona(user: CompareUserData) {
  const { stats, profile, activity } = user;

  let additions = 0;
  let deletions = 0;
  activity.forEach((a) => {
    additions += a.locAdditions || 0;
    deletions += a.locDeletions || 0;
  });

  // Determine Persona based on stats
  if (stats.currentStreak > 30 || stats.totalContributions > 2000) {
    return {
      name: 'The Machine',
      icon: Cpu,
      color: 'from-purple-500 to-indigo-500',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    };
  }
  if (deletions > 0 && deletions > additions * 1.5) {
    return {
      name: 'The Refactorer',
      icon: RefreshCw,
      color: 'from-rose-500 to-orange-500',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    };
  }
  if (profile.stats.stars > 200) {
    return {
      name: 'The Architect',
      icon: Component,
      color: 'from-amber-400 to-yellow-600',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]',
    };
  }
  if ((stats.totalPRs || 0) > 50) {
    return {
      name: 'Team Player',
      icon: UsersIcon,
      color: 'from-blue-400 to-cyan-500',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    };
  }
  if (stats.peakStreak > 14) {
    return {
      name: 'Consistent Coder',
      icon: CalendarDays,
      color: 'from-emerald-400 to-teal-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    };
  }
  return {
    name: 'Weekend Warrior',
    icon: Tent,
    color: 'from-zinc-400 to-gray-600',
    text: 'text-zinc-400',
    border: 'border-zinc-500/30',
    shadow: 'shadow-[0_0_15px_rgba(161,161,170,0.4)]',
  };
}

/* ── helper: profile card ─────────────────────────────────────────────── */

function CompareProfileCard({ user, side }: { user: CompareUserData; side: 'left' | 'right' }) {
  const { profile, stats } = user;
  const persona = getDeveloperPersona(user);
  const PersonaIcon = persona.icon;

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
            <span className="absolute -top-1 -right-2 text-[10px] font-black bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full shadow-lg z-10 border border-black/10 dark:border-white/10">
              PRO
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{profile.name}</h3>

        {/* Animated Developer Persona Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: side === 'left' ? 0.3 : 0.4,
          }}
          whileHover={{ scale: 1.05 }}
          className={`relative flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full border bg-white/5 dark:bg-black/20 backdrop-blur-sm ${persona.border} ${persona.shadow}`}
        >
          {/* Subtle background glow that pulses */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${persona.color} opacity-20 blur-sm`}
          />
          <PersonaIcon size={12} className={persona.text} />
          <span
            className={`text-[10px] font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${persona.color}`}
          >
            {persona.name}
          </span>
        </motion.div>

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

/* ── helper: coding habit showdown ────────────────────────────────────── */

function CodingHabitCard({
  username,
  habit,
  side,
}: {
  username: string;
  habit?: string;
  side: 'left' | 'right';
}) {
  const isNight = habit === 'Night Owl';
  const isEarly = habit === 'Early Bird';

  const icon = isNight ? (
    <Moon size={24} className="text-purple-400" />
  ) : isEarly ? (
    <Sun size={24} className="text-amber-400" />
  ) : (
    <Coffee size={24} className="text-teal-400" />
  );
  const bgClass = isNight
    ? 'bg-gradient-to-br from-indigo-950 to-purple-950 border-purple-500/30'
    : isEarly
      ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-orange-500/30'
      : 'bg-gradient-to-br from-teal-900/40 to-emerald-900/40 border-teal-500/30';

  const glowClass = isNight
    ? 'shadow-[0_0_15px_rgba(168,85,247,0.15)]'
    : isEarly
      ? 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
      : 'shadow-[0_0_15px_rgba(20,184,166,0.15)]';

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden p-6 rounded-2xl border ${bgClass} ${glowClass} transition-all duration-300 flex flex-col items-center justify-center text-center h-full min-h-[140px]`}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-3 z-10"
      >
        {icon}
      </motion.div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1 z-10">
        @{username}
      </h4>
      <h3 className="text-xl font-black tracking-tight text-white z-10">{habit || 'Unknown'}</h3>

      {/* Decorative background elements */}
      {isNight && (
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-6 text-purple-300/20 text-xs"
        >
          ★
        </motion.div>
      )}
      {isEarly && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-6 -right-6 text-amber-500/10"
        >
          <Sun size={80} />
        </motion.div>
      )}
    </motion.div>
  );
}

function CodingHabitShowdown({ user1, user2 }: { user1: CompareUserData; user2: CompareUserData }) {
  return (
    <div>
      <h2 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-4">
        Coding Habits
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <CodingHabitCard
          username={user1.profile.username}
          habit={user1.stats.codingHabit}
          side="left"
        />

        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0a0a0a] border-2 border-black/10 dark:border-[rgba(255,255,255,0.08)] flex items-center justify-center shadow-xl">
            <span className="text-[10px] font-bold text-[#A1A1AA] tracking-wider">VS</span>
          </div>
        </div>

        <CodingHabitCard
          username={user2.profile.username}
          habit={user2.stats.codingHabit}
          side="right"
        />
      </div>
    </div>
  );
}

/* ── helper: code volume showdown ─────────────────────────────────────── */

function CodeVolumeShowdown({ user1, user2 }: { user1: CompareUserData; user2: CompareUserData }) {
  const calcLoC = (activity: ActivityData[]) => {
    let add = 0,
      del = 0;
    activity.forEach((d) => {
      add += d.locAdditions || 0;
      del += d.locDeletions || 0;
    });
    return { add, del, net: add - del };
  };

  const loc1 = calcLoC(user1.activity);
  const loc2 = calcLoC(user2.activity);

  const maxAdd = Math.max(loc1.add, loc2.add, 1);
  const maxDel = Math.max(loc1.del, loc2.del, 1);

  const users = [
    { username: user1.profile.username, loc: loc1, side: 'left' as const },
    { username: user2.profile.username, loc: loc2, side: 'right' as const },
  ];

  return (
    <div>
      <h2 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-4 flex items-center gap-2">
        <Code2 size={14} className="text-violet-400" />
        Code Volume
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(({ username, loc, side }) => (
          <motion.div
            key={side}
            initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] transition-all duration-300"
          >
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-5">
              @{username}
            </h4>

            {/* Additions Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <Plus size={12} /> Lines Added
                </span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-sm font-bold text-emerald-500"
                >
                  +{loc.add.toLocaleString()}
                </motion.span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden border border-black/5 dark:border-[rgba(255,255,255,0.04)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(loc.add / maxAdd) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                />
              </div>
            </div>

            {/* Deletions Bar */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                  <Minus size={12} /> Lines Deleted
                </span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-sm font-bold text-rose-500"
                >
                  -{loc.del.toLocaleString()}
                </motion.span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-[#111] rounded-full overflow-hidden border border-black/5 dark:border-[rgba(255,255,255,0.04)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(loc.del / maxDel) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                />
              </div>
            </div>

            {/* Net Impact */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-black/5 dark:border-[rgba(255,255,255,0.06)]">
              <span className="text-[9px] font-medium text-[#A1A1AA] uppercase tracking-widest">
                Net Impact
              </span>
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.6 }}
                className={`text-lg font-black tracking-tight ${loc.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {loc.net >= 0 ? '+' : ''}
                {loc.net.toLocaleString()}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── helper: developer skills radar chart ──────────────────────────────── */

function normalizeSkill(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.round((value / max) * 100), 100);
}

function DeveloperSkillsRadar({
  user1,
  user2,
}: {
  user1: CompareUserData;
  user2: CompareUserData;
}) {
  // Compute raw values for each skill dimension
  const calcLoC = (activity: ActivityData[]) => {
    let add = 0;
    activity.forEach((d) => {
      add += d.locAdditions || 0;
    });
    return add;
  };

  const raw1 = {
    volume: user1.stats.totalContributions + calcLoC(user1.activity),
    consistency: user1.stats.currentStreak * 2 + user1.stats.peakStreak,
    impact: user1.profile.stats.stars * 3 + user1.profile.stats.followers,
    collaboration: (user1.stats.totalPRs || 0) * 2 + (user1.stats.totalIssues || 0),
    versatility: user1.languages.length * 20,
  };

  const raw2 = {
    volume: user2.stats.totalContributions + calcLoC(user2.activity),
    consistency: user2.stats.currentStreak * 2 + user2.stats.peakStreak,
    impact: user2.profile.stats.stars * 3 + user2.profile.stats.followers,
    collaboration: (user2.stats.totalPRs || 0) * 2 + (user2.stats.totalIssues || 0),
    versatility: user2.languages.length * 20,
  };

  // Normalize against combined max for fair comparison
  const maxVolume = Math.max(raw1.volume, raw2.volume, 1);
  const maxConsistency = Math.max(raw1.consistency, raw2.consistency, 1);
  const maxImpact = Math.max(raw1.impact, raw2.impact, 1);
  const maxCollaboration = Math.max(raw1.collaboration, raw2.collaboration, 1);
  const maxVersatility = Math.max(raw1.versatility, raw2.versatility, 1);

  const radarData = [
    {
      skill: 'Volume',
      user1: normalizeSkill(raw1.volume, maxVolume),
      user2: normalizeSkill(raw2.volume, maxVolume),
    },
    {
      skill: 'Consistency',
      user1: normalizeSkill(raw1.consistency, maxConsistency),
      user2: normalizeSkill(raw2.consistency, maxConsistency),
    },
    {
      skill: 'Impact',
      user1: normalizeSkill(raw1.impact, maxImpact),
      user2: normalizeSkill(raw2.impact, maxImpact),
    },
    {
      skill: 'Collaboration',
      user1: normalizeSkill(raw1.collaboration, maxCollaboration),
      user2: normalizeSkill(raw2.collaboration, maxCollaboration),
    },
    {
      skill: 'Versatility',
      user1: normalizeSkill(raw1.versatility, maxVersatility),
      user2: normalizeSkill(raw2.versatility, maxVersatility),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-4 flex items-center gap-2">
        <Trophy size={14} className="text-amber-400" />
        Developer Skills Radar
      </h2>
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
        {/* Legend */}
        <div className="flex justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8B5CF6' }} />
            <span className="text-xs text-[#A1A1AA] font-medium">@{user1.profile.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06B6D4' }} />
            <span className="text-xs text-[#A1A1AA] font-medium">@{user2.profile.username}</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="rgba(161,161,170,0.15)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{
                fill: '#A1A1AA',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name={user1.profile.username}
              dataKey="user1"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Radar
              name={user2.profile.username}
              dataKey="user2"
              stroke="#06B6D4"
              fill="#06B6D4"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 4, fill: '#06B6D4', strokeWidth: 0 }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#fff',
              }}
              itemStyle={{ color: '#e4e4e7', fontSize: '11px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ── main component ───────────────────────────────────────────────────── */

export default function CompareClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user1, setUser1] = useState(searchParams.get('user1') || '');
  const [user2, setUser2] = useState(searchParams.get('user2') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);

  const handleDownloadCard = async () => {
    if (!captureRef.current || !data) return;
    setIsExporting(true);

    try {
      // Small delay to allow export overlay/scanning UI to render first
      await new Promise((res) => setTimeout(res, 300));

      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // higher resolution
        backgroundColor: document.documentElement.classList.contains('dark')
          ? '#000000'
          : '#ffffff',
        useCORS: true,
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `commitpulse-battle-${data.user1.profile.username}-vs-${data.user2.profile.username}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  };

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
      // Intentional: this is a one-time mount-only fetch trigger, not a
      // setState call. The disable is misidentified by the rule — handleCompare
      // is an async function that internally calls setLoading/setData/setError.
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
    <>
      <div className="pt-20 sm:pt-24 w-full">
        <TopRivalriesTicker />
      </div>
      <main className="min-h-screen pt-8 pb-16 px-4 sm:px-6">
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
              Put two GitHub profiles head-to-head. Streaks, contributions, languages — who comes
              out on top?
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
                  aria-label="Enter first GitHub username to compare"
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
                  aria-label="Enter second GitHub username to compare"
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
                aria-label="Compare two GitHub profiles"
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
                ref={captureRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 relative pb-20"
              >
                {/* Optional: Spotify Wrapped style header only visible in the canvas or just part of the card */}
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none overflow-hidden w-full h-full z-0 flex items-center justify-center">
                  <Swords size={400} className="text-emerald-500 blur-3xl" />
                </div>

                <div className="relative z-10 space-y-8">
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
                    <CompareProfileCard user={d1} side="left" />

                    {/* VS Divider */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0a0a] border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <span className="text-xs font-bold text-emerald-500 tracking-wider">
                          VS
                        </span>
                      </div>
                    </div>

                    <CompareProfileCard user={d2} side="right" />
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
                      <StatBattle
                        label="Pull Requests"
                        icon={GitPullRequest}
                        valueA={d1.stats.totalPRs || 0}
                        valueB={d2.stats.totalPRs || 0}
                      />
                      <StatBattle
                        label="Issues"
                        icon={CircleDot}
                        valueA={d1.stats.totalIssues || 0}
                        valueB={d2.stats.totalIssues || 0}
                      />
                    </div>
                  </div>

                  {/* Coding Habits Showdown */}
                  <CodingHabitShowdown user1={d1} user2={d2} />

                  {/* Code Volume Showdown */}
                  <CodeVolumeShowdown user1={d1} user2={d2} />

                  {/* Developer Skills Radar */}
                  <DeveloperSkillsRadar user1={d1} user2={d2} />

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
                </div>

                {/* Floating Share Button */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 1 }}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadCard}
                    disabled={isExporting}
                    className="flex items-center gap-3 px-6 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-colors overflow-hidden relative group"
                  >
                    <motion.div
                      animate={isExporting ? { rotate: 360 } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      {isExporting ? <Loader2 size={20} /> : <Camera size={20} />}
                    </motion.div>
                    <span>{isExporting ? 'Generating Epic Card...' : 'Export Wrapped Card'}</span>

                    {/* Subtle glare effect on hover */}
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                  </motion.button>
                </motion.div>

                {/* Fullscreen Scanner Overlay during export */}
                <AnimatePresence>
                  {isExporting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none"
                    >
                      <motion.div
                        animate={{ y: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="w-full max-w-4xl h-1 bg-emerald-500 shadow-[0_0_20px_4px_rgba(16,185,129,0.5)] rounded-full opacity-70"
                      />
                      <p className="mt-8 text-xl font-bold text-white tracking-widest uppercase">
                        Capturing the Showdown...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
