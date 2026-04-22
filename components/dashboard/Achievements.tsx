'use client';

import { motion } from 'framer-motion';
import { Trophy, Moon, Flame, Code, Sun, LucideIcon } from 'lucide-react';
import { Achievement } from '@/types/dashboard';

const iconMap: Record<string, LucideIcon> = {
  Moon,
  Flame,
  Code,
  Sun,
  Trophy
};

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
    >
      <div className="absolute bottom-0 right-0 w-[150px] h-[150px] bg-pink-500/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-white/10">
          <Trophy size={16} className="text-pink-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Achievements</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        {achievements.map((achievement, i) => {
          const Icon = iconMap[achievement.icon] || Trophy;
          
          return (
            <motion.div 
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              whileHover={{ scale: 1.05 }}
              className={`p-3 flex flex-col items-center text-center rounded-xl border transition-all duration-300 ${
                achievement.isUnlocked
                  ? 'bg-gradient-to-b from-white/10 to-white/5 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                  : 'bg-white/5 border-white/5 opacity-50 grayscale'
              }`}
            >
              <div className={`p-2 rounded-full mb-2 ${achievement.isUnlocked ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-pink-400' : 'bg-white/10 text-white/50'}`}>
                <Icon size={20} />
              </div>
              <h4 className="text-xs font-bold text-white mb-1 line-clamp-1 w-full">{achievement.title}</h4>
              <p className="text-[10px] text-white/50 line-clamp-2 w-full">
                {achievement.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
