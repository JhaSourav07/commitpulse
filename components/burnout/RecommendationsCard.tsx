'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface RecommendationsCardProps {
  recommendations: string[];
}

export default function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.02] to-purple-500/[0.02] dark:from-indigo-950/20 dark:to-purple-950/20 relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2.5 mb-5">
        <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          AI & Heuristic Recommendations
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        {recommendations.map((recommendation, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.2 }}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/30 hover:border-black/10 dark:hover:border-white/10 transition-all group"
          >
            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <ArrowRight size={12} />
            </div>

            <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
              {recommendation}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
