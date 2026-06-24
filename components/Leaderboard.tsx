'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp } from 'lucide-react';
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

export default function Leaderboard({ contributors = [] }: LeaderboardProps) {
  const safeContributors = contributors || [];
  const top3 = safeContributors.slice(0, 3);
  const listEntries = safeContributors.slice(3);

  const rank1 = top3[0];
  const rank2 = top3[1];
  const rank3 = top3[2];

  return (
    <div className="w-full mx-auto font-sans relative overflow-hidden bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/[0.08] backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] text-black dark:text-white">
      {/* ── Ambient Background Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-[#eab308]/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[5%] h-[250px] w-[250px] rounded-full bg-cyan-500/[0.06] blur-[80px]" />
        <div className="absolute top-[25%] right-[5%] h-[250px] w-[250px] rounded-full bg-purple-500/[0.06] blur-[80px]" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#050505]/80 to-transparent" />
      </div>

      {/* ── Podium Section ── */}
      <div className="flex items-end justify-center h-[300px] sm:h-[360px] mb-16 gap-3 sm:gap-6 relative mt-8">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_70%)]" />

        {/* Rank 2 (Left) */}
        {rank2 && (
          <PodiumItem
            contributor={rank2}
            rank={2}
            height="130px"
            variant="silver"
            delay={0.3}
            isFirst={false}
          />
        )}

        {/* Rank 1 (Center) */}
        {rank1 && (
          <PodiumItem
            contributor={rank1}
            rank={1}
            height="180px"
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
            height="100px"
            variant="bronze"
            delay={0.5}
            isFirst={false}
          />
        )}
      </div>

      {/* ── Remaining List ── */}
      <div className="flex flex-col gap-2 relative z-10">
        {listEntries.map((contributor, i) => (
          <motion.div
            key={contributor.id}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.6, type: 'spring', stiffness: 80 }}
            whileHover={{ x: 6, scale: 1.01 }}
            role="button"
            tabIndex={0}
            className="flex items-center justify-between p-4 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:border-black/10 dark:hover:border-white/10 transition-all duration-300 cursor-pointer group"
            onClick={() => window.open(contributor.html_url, '_blank', 'noopener,noreferrer')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.open(contributor.html_url, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center min-w-[3rem] px-2 h-9 rounded-lg bg-black/5 dark:bg-white/[0.05] text-sm font-bold text-zinc-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-colors font-mono whitespace-nowrap">
                #{i + 4}
              </div>

              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-black/10 dark:border-white/10 group-hover:border-cyan-400/40 transition-colors">
                {contributor.avatar_url ? (
                  <img
                    src={contributor.avatar_url}
                    alt={contributor.login}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-white/10" />
                )}
              </div>

              {/* Name */}
              <span className="min-w-0 max-w-[14rem] truncate font-semibold text-black dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                {contributor.login}
              </span>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp className="h-4 w-4 text-zinc-500 dark:text-zinc-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
              <span className="font-mono font-bold text-black dark:text-white">
                {contributor.contributions}
              </span>
              <span className="text-zinc-500 dark:text-zinc-600 hidden sm:inline">commits</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Podium Sub-component ──

interface PodiumItemProps {
  contributor: Contributor;
  rank: number;
  height: string;
  variant: 'gold' | 'silver' | 'bronze';
  delay: number;
  isFirst: boolean;
}

function PodiumItem({ contributor, height, variant, delay, isFirst }: PodiumItemProps) {
  const styles = {
    gold: {
      ring: 'ring-[#eab308]/70',
      crown: 'text-[#eab308]',
      name: 'text-[#fbbf24]',
      pillarGradient: 'from-[#eab308]/30 via-[#eab308]/10 to-transparent',
      glow: 'rgba(234,179,8,0.5)',
      glowBg: 'bg-[#eab308]/20',
    },
    silver: {
      ring: 'ring-zinc-400/70',
      crown: 'text-zinc-400',
      name: 'text-zinc-300',
      pillarGradient: 'from-zinc-400/20 via-zinc-400/5 to-transparent',
      glow: 'rgba(161,161,170,0.4)',
      glowBg: 'bg-zinc-400/10',
    },
    bronze: {
      ring: 'ring-amber-600/70',
      crown: 'text-amber-600',
      name: 'text-amber-400',
      pillarGradient: 'from-amber-600/25 via-amber-600/8 to-transparent',
      glow: 'rgba(217,119,6,0.4)',
      glowBg: 'bg-amber-600/15',
    },
  };

  const theme = styles[variant];

  return (
    <div className="flex flex-col items-center relative z-10 w-28 sm:w-36 cursor-pointer group">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={isFirst ? { opacity: 1, y: [0, -8, 0] } : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={
          isFirst
            ? {
                delay,
                opacity: { duration: 0.6 },
                y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
              }
            : { delay, duration: 0.7, type: 'spring', stiffness: 80 }
        }
        className="flex flex-col items-center relative z-20 w-full"
      >
        {/* Avatar Container */}
        <div className="relative flex flex-col items-center mb-4 group-hover:-translate-y-2 transition-transform duration-500">
          {/* Crown */}
          <div
            className={`absolute -top-8 z-30 ${theme.crown} transition-transform duration-500 group-hover:scale-125 group-hover:-translate-y-1`}
          >
            <Crown size={22} fill="currentColor" strokeWidth={1} />
          </div>

          {/* Pulsing glow for #1 */}
          {isFirst && (
            <motion.div
              className="absolute inset-0 rounded-full z-0"
              style={{ boxShadow: `0 0 50px 15px ${theme.glow}` }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Avatar */}
          <div
            className={`relative z-20 w-18 h-18 sm:w-22 sm:h-22 rounded-full ring-[3px] ${theme.ring} ring-offset-[5px] ring-offset-[#0a0a0a] shadow-2xl transition-all duration-500 group-hover:ring-offset-[8px]`}
            style={{ width: isFirst ? 88 : 72, height: isFirst ? 88 : 72 }}
          >
            {contributor.avatar_url ? (
              <img
                src={contributor.avatar_url}
                alt={contributor.login}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-200 dark:bg-white/10" />
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="relative z-20 flex flex-col items-center w-full px-3 py-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/[0.08] backdrop-blur-md transition-all duration-300 group-hover:bg-black/[0.08] dark:group-hover:bg-white/[0.1] group-hover:border-black/15 dark:group-hover:border-white/15">
          <div className={`font-bold truncate w-full text-center ${theme.name} text-sm`}>
            {contributor.login}
          </div>
          <div className="text-zinc-500 text-xs font-mono mt-1">
            {contributor.contributions} <span className="hidden sm:inline">commits</span>
          </div>
        </div>
      </motion.div>

      {/* Podium Pillar */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        whileInView={{ height, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.3, duration: 1, type: 'spring', bounce: 0.15 }}
        className={`w-24 sm:w-32 rounded-t-xl bg-gradient-to-b ${theme.pillarGradient} border-t border-x border-black/10 dark:border-white/[0.06] -mt-5 relative z-10 overflow-hidden`}
      >
        {/* Pillar inner glow */}
        <div className={`absolute inset-x-0 top-0 h-12 ${theme.glowBg} blur-lg rounded-t-xl`} />
        {/* Vertical scan line */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_30%,transparent_70%,rgba(255,255,255,0.02)_100%)]" />
      </motion.div>
    </div>
  );
}
