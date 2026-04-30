'use client';

import { motion } from 'framer-motion';
import { Trophy, Moon, Flame, Code, Sun, LucideIcon } from 'lucide-react';
import { Achievement } from '@/types/dashboard';

const iconMap: Record<string, LucideIcon> = { Moon, Flame, Code, Sun, Trophy };

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
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
        {achievements.map((achievement, i) => {
          const Icon = iconMap[achievement.icon] || Trophy;
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
              <h4 className="text-[11px] font-semibold text-white mb-1 line-clamp-1 w-full leading-snug">
                {achievement.title}
              </h4>
              <p className="text-[10px] text-[#A1A1AA] line-clamp-2 w-full leading-relaxed">
                {achievement.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
