'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Flame, Sparkles } from 'lucide-react';
import { Achievement } from '@/types/dashboard';

/** Map achievement type to the matching Lucide icon component. */
function AchievementIcon({ type, isUnlocked }: { type: Achievement['type']; isUnlocked: boolean }) {
  const cls = `mb-2.5 ${isUnlocked ? 'text-[#A1A1AA]' : 'text-[#555]'}`;
  if (type === 'streak') return <Flame size={18} className={cls} />;
  if (type === 'behavior') return <Sparkles size={18} className={cls} />;
  return <Trophy size={18} className={cls} />;
}

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleAchievements = showAll ? achievements : achievements.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Trophy size={15} className="text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
          Achievements
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visibleAchievements.map((achievement, i) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.07, duration: 0.2 }}
            className={`p-4 flex flex-col items-center text-center rounded-lg border transition-all duration-200 ${
              achievement.isUnlocked
                ? 'bg-gray-100 dark:bg-[#111] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-gray-200 dark:hover:bg-[#161616] cursor-default'
                : 'bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-[rgba(255,255,255,0.04)] opacity-30 grayscale pointer-events-none'
            }`}
          >
            <AchievementIcon type={achievement.type} isUnlocked={achievement.isUnlocked} />
            <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1 text-center w-full leading-snug">
              {achievement.title}
            </h4>
            <p className="text-[10px] text-[#A1A1AA] line-clamp-2 w-full leading-relaxed">
              {achievement.description}
            </p>

            {/* Progress indicator for locked achievements */}
            {!achievement.isUnlocked && achievement.progress !== undefined && (
              <div className="mt-2 w-full">
                <div className="w-full h-1 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#A1A1AA]/40 transition-all duration-500"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#777] mt-1">
                  {achievement.currentValue}/{achievement.threshold}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {achievements.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full rounded-lg border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-black dark:bg-white py-2 text-xs font-medium text-white dark:text-black cursor-pointer transition-all duration-300 ease-in-out hover:bg-zinc-800 dark:hover:bg-zinc-100 hover:opacity-90 hover:scale-[1.02] hover:shadow-md"
        >
          {showAll ? 'Show Less' : 'See All Achievements'}
        </button>
      )}
    </motion.div>
  );
}
