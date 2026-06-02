'use client';

import { motion } from 'framer-motion';
import { DEMO_STATS } from './constants';

function formatStatValue(value: number, suffix: string) {
  const formatted = value >= 1000 ? value.toLocaleString() : String(value);
  return `${formatted}${suffix}`;
}

export function AnimatedStatCards({ className = '' }: { className?: string }) {
  return (
    <div
      className={`grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}
      data-testid="demo-stat-cards"
    >
      {DEMO_STATS.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index, duration: 0.45, ease: 'easeOut' }}
          className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-left shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/45">
            {stat.label}
          </p>
          <motion.p
            className="mt-1 text-xl font-bold tabular-nums text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.08, duration: 0.5 }}
          >
            {formatStatValue(stat.value, stat.suffix)}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
}
