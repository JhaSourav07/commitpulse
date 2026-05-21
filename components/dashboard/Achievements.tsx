'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { Achievement } from '@/types/dashboard';

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleAchievements = showAll ? achievements : achievements.slice(0, 4);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Trophy size={15} className="text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-white tracking-tight">Achievements</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visibleAchievements.map((achievement, i) => {
          const Icon = achievement.type === 'streak' ? Flame : Trophy;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.2 }}
              className={`p-4 flex flex-col items-center text-center rounded-lg border transition-all duration-200 ${
                achievement.isUnlocked
                  ? 'bg-[#111] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[#161616] cursor-default'
                  : 'bg-[#0a0a0a] border-[rgba(255,255,255,0.04)] opacity-30 grayscale pointer-events-none'
              }`}
            >
              <Icon
                size={18}
                className={`mb-2.5 ${achievement.isUnlocked ? 'text-[#A1A1AA]' : 'text-[#555]'}`}
              />
              <h4 className="text-[11px] font-semibold text-white mb-1 text-center w-full leading-snug">
                {achievement.title}
              </h4>
              <p className="text-[10px] text-[#A1A1AA] line-clamp-2 w-full leading-relaxed">
                {achievement.description}
              </p>
              {achievement.progress !== undefined && !achievement.isUnlocked && (
                <p className="text-[10px] text-[#777] mt-2">
                  {achievement.currentValue}/{achievement.threshold}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
      {achievements.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111] py-2 text-xs font-medium text-white transition-all hover:bg-[#161616]"
        >
          {showAll ? 'Show Less' : 'See All Achievements'}
        </button>
      )}
    </motion.div>
  );
}
