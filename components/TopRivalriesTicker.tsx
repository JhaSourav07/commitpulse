'use client';

import { motion } from 'framer-motion';
import { Flame, Star, Swords, Target, Trophy, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MOCK_RIVALRIES = [
  {
    u1: 'torvalds',
    u2: 'gaearon',
    label: 'Kernel vs React',
    icon: Flame,
    color: 'text-orange-500',
  },
  {
    u1: 'rich-harris',
    u2: 'antfu',
    label: 'Svelte vs Nuxt',
    icon: Zap,
    color: 'text-yellow-400',
  },
  {
    u1: 'shadcn',
    u2: 'pacocoursey',
    label: 'UI Masters',
    icon: Target,
    color: 'text-indigo-400',
  },
  {
    u1: 'rauchg',
    u2: 'biilmann',
    label: 'Vercel & Netlify Founders',
    icon: Trophy,
    color: 'text-emerald-500',
  },
  {
    u1: 'dhh',
    u2: 'taylorotwell',
    label: 'Ruby vs PHP',
    icon: Star,
    color: 'text-rose-500',
  },
  {
    u1: 'jhasourav07',
    u2: 'leerob',
    label: 'Rising vs Vet',
    icon: Swords,
    color: 'text-purple-500',
  },
];

export interface RivalryItem {
  u1: string;
  u2: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  color: string;
}

export interface TopRivalriesTickerProps {
  rivalries?: RivalryItem[] | null;
}

export default function TopRivalriesTicker({
  rivalries = MOCK_RIVALRIES,
}: TopRivalriesTickerProps = {}) {
  const router = useRouter();

  const handleRivalryClick = (u1: string, u2: string) => {
    router.push(`/compare?user1=${encodeURIComponent(u1)}&user2=${encodeURIComponent(u2)}`);
  };

  const items = rivalries || [];

  return (
    <div className="relative flex w-full items-center overflow-hidden border-b border-black/5 bg-zinc-50 py-3 dark:border-white/5 dark:bg-[#050505]">
      {/* Edge gradients for smooth fade in/out */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-zinc-50 to-transparent sm:w-16 dark:from-[#050505]" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-zinc-50 to-transparent sm:w-16 dark:from-[#050505]" />

      {/* Marquee content */}
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          ease: 'linear',
          duration: 30,
          repeat: Infinity,
        }}
      >
        {items.length === 0 ? (
          <div className="flex w-full items-center justify-center px-6 py-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            No active rivalries
          </div>
        ) : (
          [...items, ...items].map((rivalry, idx) => {
            const Icon = rivalry.icon;

            return (
              <div
                key={idx}
                onClick={() => handleRivalryClick(rivalry.u1, rivalry.u2)}
                className="group mx-2 flex cursor-pointer items-center gap-3 rounded-full px-6 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Icon
                  size={14}
                  className={`${rivalry.color} opacity-70 transition-opacity group-hover:opacity-100`}
                />

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-black dark:text-zinc-300 dark:group-hover:text-white">
                    {rivalry.u1}
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    VS
                  </span>

                  <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-black dark:text-zinc-300 dark:group-hover:text-white">
                    {rivalry.u2}
                  </span>
                </div>

                <span className="rounded-md border border-black/5 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-white/10 dark:bg-black/20 dark:text-zinc-500">
                  {rivalry.label}
                </span>
              </div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
