'use client';

import { motion } from 'framer-motion';
import {
  Star,
  TrendingUp,
  Users,
  GitCommit,
  Flame,
  Trophy,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';
import type { HallOfFameAward } from '@/types/dashboard';
import Image from 'next/image';

interface HallOfFameProps {
  data?: HallOfFameAward[];
}

const ICONS: Record<string, LucideIcon> = {
  popular: Star,
  growing: TrendingUp,
  collaborative: Users,
  contributed: GitCommit,
  active: Flame,
};

const COLOR_VARIANTS: Record<string, string> = {
  popular: 'from-amber-400 to-orange-500 shadow-orange-500/20 text-orange-500',
  growing: 'from-emerald-400 to-teal-500 shadow-teal-500/20 text-teal-500',
  collaborative: 'from-blue-400 to-indigo-500 shadow-indigo-500/20 text-indigo-500',
  contributed: 'from-rose-400 to-pink-500 shadow-pink-500/20 text-pink-500',
  active: 'from-fuchsia-400 to-purple-500 shadow-purple-500/20 text-purple-500',
};

const BORDER_VARIANTS: Record<string, string> = {
  popular: 'border-orange-500/30 dark:border-orange-500/20',
  growing: 'border-teal-500/30 dark:border-teal-500/20',
  collaborative: 'border-indigo-500/30 dark:border-indigo-500/20',
  contributed: 'border-pink-500/30 dark:border-pink-500/20',
  active: 'border-purple-500/30 dark:border-purple-500/20',
};

const BADGE_VARIANTS: Record<string, string> = {
  popular: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  growing: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  collaborative: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  contributed: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  active: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

export default function HallOfFame({ data }: HallOfFameProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/5 dark:bg-black/20 p-8 backdrop-blur-xl flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          GitHub Hall of Fame
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Keep building and contributing! Once you gather more activity, your top repositories will
          be showcased here.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-12 mb-8">
      <div className="flex items-center gap-3 mb-6 px-1">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          GitHub Hall of Fame
        </h2>
      </div>

      <div className="flex flex-wrap gap-6">
        {data.map((award, index) => {
          const Icon = ICONS[award.category] || Trophy;
          const gradient = COLOR_VARIANTS[award.category] || 'from-gray-400 to-gray-500';
          const borderInfo = BORDER_VARIANTS[award.category] || 'border-gray-500/30';
          const badgeStyle = BADGE_VARIANTS[award.category] || 'bg-gray-500/10 text-gray-600';
          const isLargeValue = String(award.centerpieceValue).length > 4;

          return (
            <motion.a
              href={award.url}
              target="_blank"
              rel="noopener noreferrer"
              key={`${award.category}-${award.title}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              className={`flex-grow basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)] group relative overflow-hidden rounded-3xl border ${borderInfo} bg-white/60 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl dark:hover:bg-zinc-900/60`}
            >
              {/* Background Glow */}
              <div
                className={`absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${gradient} opacity-[0.15] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.35]`}
              />
              <div
                className={`absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-gradient-to-tr ${gradient} opacity-[0.1] blur-[50px] transition-opacity duration-500 group-hover:opacity-[0.25]`}
              />

              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Top: Icon + Title */}
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase ${badgeStyle} flex items-center gap-2 border border-current/20`}
                  >
                    <Icon className="w-4 h-4" />
                    {award.title}
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </div>

                {/* Centerpiece: Large Metric */}
                <div className="flex flex-col items-center justify-center text-center my-6 py-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    {award.centerpieceLabel}
                  </span>
                  <div
                    className={`font-black text-transparent bg-clip-text bg-gradient-to-br ${gradient} ${isLargeValue ? 'text-5xl' : 'text-7xl'} tracking-tighter filter drop-shadow-sm`}
                  >
                    {award.centerpieceValue}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/5 px-4 py-1 rounded-full">
                    {award.bottomStats}
                  </div>
                </div>

                {/* Middle/Bottom: Repo Name & Avatar */}
                <div className="flex items-center gap-4 bg-black/5 dark:bg-white/[0.03] p-4 rounded-2xl border border-black/5 dark:border-white/5">
                  {award.repoAvatar ? (
                    <Image
                      src={award.repoAvatar}
                      alt={award.repoName}
                      width={40}
                      height={40}
                      className="rounded-full shadow-md bg-white border border-black/10 dark:border-white/10"
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center shadow-md">
                      <Trophy className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-300 transition-all">
                      {award.repoName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {award.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
