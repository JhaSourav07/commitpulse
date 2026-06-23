'use client';

import { motion } from 'framer-motion';
import { Trophy, Flame, Code, Users, LucideIcon } from 'lucide-react';

interface AchievementBadgeProps {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  type: 'streak' | 'contributions' | 'collaboration' | 'legend';
}

const ICON_MAP: Record<AchievementBadgeProps['type'], LucideIcon> = {
  streak: Flame,
  contributions: Code,
  collaboration: Users,
  legend: Trophy,
};

export default function AchievementBadge({
  title,
  description,
  isUnlocked,
  type,
}: AchievementBadgeProps) {
  const IconComponent = ICON_MAP[type] || Trophy;

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      role="img"
      aria-label={`Achievement: ${title}. ${isUnlocked ? 'Unlocked' : 'Locked'}. ${description}`}
      className={`p-4 flex flex-col items-center justify-center text-center rounded-xl border transition-all duration-200 ${
        isUnlocked
          ? 'bg-zinc-50 dark:bg-zinc-900/50 border-black/10 dark:border-white/10 shadow-sm'
          : 'bg-zinc-100/50 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-900 opacity-40 grayscale'
      }`}
    >
      <div
        className={`p-3 rounded-full mb-3 ${
          isUnlocked
            ? 'bg-amber-500/10 text-amber-500'
            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
        }`}
      >
        <IconComponent size={20} />
      </div>
      <span className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">{title}</span>
      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal max-w-[130px] line-clamp-2">
        {description}
      </span>
    </motion.div>
  );
}
