'use client';

import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, Zap, Calendar, LucideIcon } from 'lucide-react';
import { AIInsight } from '@/types/dashboard';

const iconMap: Record<string, LucideIcon> = {
  Moon,
  Sun,
  Zap,
  Calendar,
};

export default function AIInsights({ insights }: { insights: AIInsight[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border border-white/10">
          <Sparkles size={16} className="text-cyan-400" />
        </div>
        <h3 className="text-lg font-bold text-white">AI Insights</h3>
      </div>

      <div className="flex flex-col gap-3 relative z-10">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.icon] || Sparkles;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="mt-0.5 text-purple-400 group-hover:text-pink-400 transition-colors">
                <Icon size={16} />
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{insight.text}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
