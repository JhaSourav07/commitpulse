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

export default function HallOfFame({ data }: HallOfFameProps) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-black/10 dark:border-white/10 bg-white/5 dark:bg-black/20 p-8 backdrop-blur-xl flex flex-col items-center justify-center text-center">
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
        <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          GitHub Hall of Fame
        </h2>
      </div>

      <div className="flex flex-wrap gap-6">
        {data.map((award, index) => {
          const Icon = ICONS[award.category] || Trophy;
          return (
            <motion.a
              href={award.url}
              target="_blank"
              rel="noopener noreferrer"
              key={`${award.category}-${award.title}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="flex-grow basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)] group relative overflow-hidden rounded-3xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(99,102,241,0.08)] p-6 transition-all hover:-translate-y-2"
            >
              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Top: Icon + Title */}
                <div className="flex items-center justify-between mb-6">
                  <div className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border border-emerald-500/20">
                    <Icon className="w-4 h-4" />
                    {award.title}
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </div>

                {/* Centerpiece: Large Metric */}
                <div className="flex flex-col items-center justify-center text-center mb-6">
                  <span className="text-sm font-medium text-gray-500 dark:text-white/50 uppercase tracking-widest mb-2">
                    {award.centerpieceLabel}
                  </span>
                  <div className="text-4xl font-semibold text-gray-900 dark:text-white">
                    {award.centerpieceValue}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-[#111] px-4 py-1 rounded-full">
                    {award.bottomStats}
                  </div>
                </div>

                {/* Middle/Bottom: Repo Name & Avatar */}
                <div className="group flex items-center gap-4 p-4 bg-gray-100 dark:bg-[#111] rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.05)]">
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
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate transition-all">
                      {award.repoName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50 leading-relaxed mt-0.5 truncate">
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
