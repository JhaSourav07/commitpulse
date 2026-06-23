// components/dashboard/GithubWrapped.tsx

'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { Code, Flame, Calendar, Coffee, Trophy, Sparkles } from 'lucide-react';
import type { WrappedStats, UserProfile } from '@/types/dashboard';

interface GithubWrappedProps {
  profile: UserProfile;
  wrappedData: WrappedStats;
}

export default function GithubWrapped({ profile, wrappedData }: GithubWrappedProps) {
  const isWeekendGrinder = wrappedData.weekendRatio > 25;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120 },
    },
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-black text-white shadow-2xl border border-white/10">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/30 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-[150px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 p-8 md:p-12 flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={
                profile.avatarUrl.startsWith('http') || profile.avatarUrl.startsWith('/')
                  ? profile.avatarUrl
                  : `/${profile.avatarUrl}`
              }
              alt={profile.name || 'GitHub profile avatar'}
              width="64"
              height="64"
              className="w-16 h-16 rounded-full border-2 border-white/20 object-cover"
            />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
              <p className="text-white/60">@{profile.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-sm font-semibold tracking-widest uppercase">Wrapped</span>
          </div>
        </motion.div>

        {/* Big Number: Total Commits */}
        <motion.div variants={itemVariants} className="text-center py-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
            Your Year In Code
          </p>
          <h1 className="text-7xl md:text-8xl font-black bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
            {wrappedData.totalContributions.toLocaleString()}
          </h1>
          <p className="text-xl text-white/80 mt-2 font-medium">Total Contributions</p>
        </motion.div>

        {/* 2x2 Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2"
          >
            <Code className="text-cyan-400 mb-2" size={24} />
            <p className="text-sm text-white/60">Top Language</p>
            <p className="text-2xl font-bold">{wrappedData.topLanguage}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2"
          >
            <Flame className="text-orange-400 mb-2" size={24} />
            <p className="text-sm text-white/60">Highest Daily Push</p>
            <p className="text-2xl font-bold">{wrappedData.highestDailyCount} Commits</p>
            <p className="text-xs text-white/40 border-t border-white/10 pt-2 mt-1">
              Recorded on {wrappedData.mostActiveDate}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2"
          >
            <Calendar className="text-purple-400 mb-2" size={24} />
            <p className="text-sm text-white/60">Busiest Month</p>
            <p className="text-2xl font-bold">
              {(() => {
                const parts = wrappedData.busiestMonth.split('-');
                if (parts.length === 2) {
                  const [year, month] = parts.map(Number);
                  const date = new Date(year, month - 1, 1);
                  return date.toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  });
                }
                return wrappedData.busiestMonth;
              })()}
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-2"
          >
            <Coffee className="text-pink-400 mb-2" size={24} />
            <p className="text-sm text-white/60">The Weekend Grind</p>
            <p className="text-2xl font-bold">{wrappedData.weekendRatio}%</p>
            <p className="text-xs text-white/40 border-t border-white/10 pt-2 mt-1">
              Of your commits happen on weekends.{' '}
              {isWeekendGrinder ? 'Take a break! 😴' : 'Good work/life balance! ⚖️'}
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="mt-6 flex items-center justify-between border-t border-white/10 pt-6"
        >
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            <span className="text-sm font-semibold text-white/80">
              Developer Score: {profile.developerScore}/100
            </span>
          </div>
          <p className="text-xs text-white/40 font-mono tracking-wider">COMMITPULSE</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
