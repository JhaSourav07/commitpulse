'use client';

import { motion } from 'framer-motion';
import { Sparkles, Moon, Sun, Zap, Calendar, Flame, Code, Star, LucideIcon } from 'lucide-react';
import { AIInsight } from '@/types/dashboard';

const iconMap: Record<string, LucideIcon> = { Moon, Sun, Zap, Calendar, Flame, Code, Star };

export default function AIInsights({ insights }: { insights: AIInsight[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] relative"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Sparkles size={15} className="text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-white tracking-tight">AI Insights</h3>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.icon] || Sparkles;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.2 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-[#111] border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] hover:bg-[#141414] transition-all duration-200 group"
            >
              <Icon
                size={14}
                className="text-[#A1A1AA] mt-0.5 shrink-0 group-hover:text-white transition-colors duration-200"
              />
              <p className="text-sm text-[#A1A1AA] leading-relaxed group-hover:text-white/80 transition-colors duration-200">
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
