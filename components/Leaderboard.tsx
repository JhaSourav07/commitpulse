'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import Image from 'next/image';

export interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

interface LeaderboardProps {
  contributors: Contributor[];
}

export default function Leaderboard({ contributors }: LeaderboardProps) {
  // Extract top 3 and the rest (up to rank 6 as passed from parent)
  const top3 = contributors.slice(0, 3);
  const listEntries = contributors.slice(3);

  // Ensure top3 has exactly 3 items for podium layout if possible
  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  return (
    <div className="w-full mx-auto font-sans relative overflow-hidden bg-white/40 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none text-black dark:text-white transition-colors">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        {/* Center gold glow behind rank 1 */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-[#eab308]/10 dark:bg-[#eab308]/[0.07] blur-[80px]" />
        {/* Left cyan accent */}
        <div className="absolute top-[30%] left-[10%] h-[200px] w-[200px] rounded-full bg-cyan-400/[0.06] dark:bg-cyan-400/[0.04] blur-[60px]" />
        {/* Right purple accent */}
        <div className="absolute top-[20%] right-[10%] h-[200px] w-[200px] rounded-full bg-purple-400/[0.06] dark:bg-purple-400/[0.04] blur-[60px]" />
        {/* Bottom subtle gradient fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white/60 dark:from-black/20 to-transparent" />
      </div>

      {/* ── Podium Section ── */}
      <div className="flex items-end justify-center h-[280px] sm:h-[320px] mb-12 gap-2 sm:gap-4 relative mt-10">
        {/* Background Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.02)_75%,transparent_75%,transparent)] dark:bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.02)_75%,transparent_75%,transparent)] bg-[length:40px_40px] opacity-50 pointer-events-none" />

        {/* Rank 2 (Left) */}
        {rank2 && (
          <PodiumItem
            contributor={rank2}
            rank={2}
            height="120px"
            variant="silver"
            delay={0.2}
            isFirst={false}
          />
        )}

        {/* Rank 1 (Center) */}
        {rank1 && (
          <PodiumItem
            contributor={rank1}
            rank={1}
            height="160px"
            variant="gold"
            delay={0.1}
            isFirst={true}
          />
        )}

        {/* Rank 3 (Right) */}
        {rank3 && (
          <PodiumItem
            contributor={rank3}
            rank={3}
            height="90px"
            variant="bronze"
            delay={0.3}
            isFirst={false}
          />
        )}
      </div>

      {/* ── List Section ── */}
      <div className="flex flex-col gap-3">
        {listEntries.map((contributor, i) => (
          <motion.a
            key={contributor.id}
            href="#contributors"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('contributors')?.scrollIntoView({ behavior: 'smooth' });
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors group cursor-pointer no-underline"
          >
            <div className="flex items-center gap-4">
              {/* Rank Circle */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-sm font-semibold text-zinc-600 dark:text-gray-300">
                {i + 4}
              </div>

              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
                <Image
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Name */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black dark:text-white">
                  {contributor.login}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex flex-col items-end text-sm">
              <div className="text-zinc-600 dark:text-gray-300">
                Contributions:{' '}
                <span className="font-bold text-black dark:text-white ml-1">
                  {contributor.contributions}
                </span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ──

interface PodiumItemProps {
  contributor: Contributor;
  rank: number;
  height: string;
  variant: 'gold' | 'silver' | 'bronze';
  delay: number;
  isFirst: boolean;
}

function PodiumItem({ contributor, height, variant, delay, isFirst }: PodiumItemProps) {
  // Styles based on variant
  const styles = {
    gold: {
      ring: 'ring-[#eab308]', // Yellow-500
      crown: 'text-[#eab308] dark:text-[#fef08a]',
      name: 'text-[#eab308]',
      gradient: 'from-[#fef08a] to-white/40 dark:from-[#423a24] dark:to-[#262626]',
      bg: 'bg-gradient-to-b from-[#eab308]/20 to-transparent',
    },
    silver: {
      ring: 'ring-[#9ca3af]', // Gray-400
      crown: 'text-[#6b7280] dark:text-[#e5e7eb]',
      name: 'text-zinc-800 dark:text-white',
      gradient: 'from-[#f3f4f6] to-white/40 dark:from-[#374151] dark:to-[#262626]',
      bg: 'bg-gradient-to-b from-black/5 dark:from-white/10 to-transparent',
    },
    bronze: {
      ring: 'ring-[#b45309]', // Amber-700
      crown: 'text-[#b45309] dark:text-[#fed7aa]',
      name: 'text-zinc-800 dark:text-white',
      gradient: 'from-[#ffedd5] to-white/40 dark:from-[#451a03] dark:to-[#262626]',
      bg: 'bg-gradient-to-b from-[#b45309]/20 to-transparent',
    },
  };

  const theme = styles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={isFirst ? { opacity: 1, y: [0, -6, 0] } : { opacity: 1, y: 0 }}
      transition={
        isFirst
          ? {
              delay,
              opacity: { duration: 0.5 },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }
          : { delay, duration: 0.5, type: 'spring', stiffness: 100 }
      }
      className="flex flex-col items-center relative z-10 w-24 sm:w-32 cursor-pointer"
      onClick={() => {
        document.getElementById('contributors')?.scrollIntoView({ behavior: 'smooth' });
      }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          document.getElementById('contributors')?.scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {/* Avatar Container */}
      <div className="relative flex flex-col items-center mb-4">
        {/* Crown Icon (absolutely positioned above) */}
        <div className={`absolute -top-7 ${theme.crown} drop-shadow-md`}>
          <div className="bg-white/80 dark:bg-[#262626] p-1.5 rounded-t-lg shadow-sm border border-black/10 dark:border-white/10 border-b-0 backdrop-blur-md">
            <Crown size={20} fill="currentColor" strokeWidth={1.5} />
          </div>
        </div>

        {/* Pulsing glow ring for #1 */}
        {isFirst && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: '0 0 30px 8px rgba(234,179,8,0.35)',
            }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Avatar Ring */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-[4px] ${theme.ring} ring-offset-4 ring-offset-white/50 dark:ring-offset-[#1a1a1a] shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
        >
          <Image
            src={contributor.avatar_url}
            alt={contributor.login}
            fill
            className="rounded-full object-cover"
          />
        </div>
      </div>

      {/* Info Box (Overlaps the pillar) */}
      <div
        className={`relative z-20 flex flex-col items-center w-full px-2 py-3 rounded-2xl bg-white/80 dark:bg-[#333333] border border-black/10 dark:border-white/10 shadow-xl backdrop-blur-md`}
      >
        <div
          className={`font-bold truncate w-full text-center ${theme.name} text-sm flex items-center justify-center gap-1`}
        >
          {contributor.login}
        </div>
        <div className="text-zinc-500 dark:text-white/65 text-xs sm:text-sm font-medium mt-1 flex items-center gap-1">
          {contributor.contributions} <span className="hidden sm:inline">contributions</span>
        </div>
      </div>

      {/* Podium Pillar */}
      <div
        className={`w-20 sm:w-28 rounded-t-xl bg-gradient-to-b ${theme.gradient} border-t border-x border-black/5 dark:border-white/5 -mt-6 relative z-10 shadow-inner`}
        style={{ height }}
      >
        <div className={`absolute inset-0 ${theme.bg} rounded-t-xl`} />
      </div>
    </motion.div>
  );
}
