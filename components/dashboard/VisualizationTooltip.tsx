'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface VisualizationTooltipProps {
  title: string;
  children: ReactNode;
  x: number;
  y: number;
}

export default function VisualizationTooltip({ title, children, x, y }: VisualizationTooltipProps) {
  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="pointer-events-none fixed z-[9999] min-w-max max-w-xs -translate-x-1/2 -translate-y-full rounded-xl border border-black/10 bg-white/95 px-3 py-2 text-xs text-gray-800 shadow-2xl shadow-black/20 backdrop-blur-md dark:border-white/10 dark:bg-[#111]/95 dark:text-white"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="mb-1 font-semibold text-gray-950 dark:text-white">{title}</div>

      <div className="space-y-0.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
        {children}
      </div>
    </motion.div>
  );
}
