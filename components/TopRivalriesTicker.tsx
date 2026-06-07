'use client';

import { motion } from 'framer-motion';
import { Flame, Zap, Trophy, Target, Star, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MOCK_RIVALRIES = [
  {
    u1: 'torvalds',
    u2: 'gaearon',
    label: 'Kernel vs React',
    icon: Flame,
    color: 'text-orange-500',
  },
  { u1: 'rich-harris', u2: 'antfu', label: 'Svelte vs Nuxt', icon: Zap, color: 'text-yellow-400' },
  { u1: 'shadcn', u2: 'pacocoursey', label: 'UI Masters', icon: Target, color: 'text-indigo-400' },
  { u1: 'vercel', u2: 'netlify', label: 'Platform Wars', icon: Trophy, color: 'text-emerald-500' },
  { u1: 'dhh', u2: 'taylorotwell', label: 'Ruby vs PHP', icon: Star, color: 'text-rose-500' },
  {
    u1: 'jhasourav07',
    u2: 'leerob',
    label: 'Rising vs Vet',
    icon: Swords,
    color: 'text-purple-500',
  },
];

export default function TopRivalriesTicker() {
  const router = useRouter();

  const handleRivalryClick = (u1: string, u2: string) => {
    // Navigate to comparison and reload data
    router.push(`/compare?user1=${encodeURIComponent(u1)}&user2=${encodeURIComponent(u2)}`);
  };

  return (
    <div className="w-full overflow-hidden py-3 bg-zinc-50 dark:bg-[#050505] border-b border-black/5 dark:border-white/5 relative flex items-center">
      {/* Edge Gradients for smooth fade in/out */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-zinc-50 to-transparent dark:from-[#050505] z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-zinc-50 to-transparent dark:from-[#050505] z-10 pointer-events-none" />

      {/* Marquee Content */}
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          ease: 'linear',
          duration: 30,
          repeat: Infinity,
        }}
      >
        {/* We map twice to create the infinite seamless loop effect */}
        {[...MOCK_RIVALRIES, ...MOCK_RIVALRIES].map((rivalry, idx) => {
          const Icon = rivalry.icon;
          return (
            <div
              key={idx}
              onClick={() => handleRivalryClick(rivalry.u1, rivalry.u2)}
              className="group flex items-center gap-3 px-6 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors mx-2 py-1.5"
            >
              <Icon
                size={14}
                className={`${rivalry.color} opacity-70 group-hover:opacity-100 transition-opacity`}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {rivalry.u1}
                </span>
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 tracking-widest uppercase">
                  VS
                </span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {rivalry.u2}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium px-2 py-0.5 rounded-md border border-black/5 dark:border-white/10 bg-white dark:bg-black/20">
                {rivalry.label}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
