'use client';

import { motion } from 'framer-motion';
import { FolderX } from 'lucide-react';

export interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = 'No activity found for this timeframe',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full h-full min-h-[250px] flex flex-col items-center justify-center p-8 bg-white/50 dark:bg-[#0a0a0a]/50 rounded-xl border border-dashed border-black/10 dark:border-[rgba(255,255,255,0.1)] hover:border-black/20 dark:hover:border-[rgba(255,255,255,0.2)] transition-all duration-300 group backdrop-blur-sm relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.01] to-transparent dark:from-white/[0.02] dark:to-transparent pointer-events-none" />

      <motion.div
        whileHover={{ scale: 1.05, rotate: -5 }}
        className="p-4 bg-gray-50/80 dark:bg-[#111]/80 backdrop-blur-md rounded-2xl mb-5 border border-black/5 dark:border-[rgba(255,255,255,0.08)] shadow-sm group-hover:shadow-md transition-all duration-300 relative"
      >
        <FolderX className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300" />
      </motion.div>

      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center z-10">
        {message}
      </p>

      <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-2 z-10 max-w-[80%]">
        Try adjusting the year or exploring a different profile.
      </p>
    </motion.div>
  );
}
