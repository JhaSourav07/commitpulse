import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Zap, HardDrive, ArrowRight } from 'lucide-react';
import type { PRInsightData } from '@/services/github/pr-insights';

export default function Highlights({ highlights }: { highlights: PRInsightData['highlights'] }) {
  const cards = [
    {
      id: 'fastest',
      title: 'Fastest Merged PR',
      data: highlights.fastestMerged,
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      value: highlights.fastestMerged ? `${highlights.fastestMerged.time.toFixed(1)} hrs` : 'N/A',
      desc: highlights.fastestMerged?.title,
    },
    {
      id: 'discussed',
      title: 'Most Discussed',
      data: highlights.mostDiscussed,
      icon: MessageSquare,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      value: highlights.mostDiscussed ? `${highlights.mostDiscussed.comments} comments` : 'N/A',
      desc: highlights.mostDiscussed?.title,
    },
    {
      id: 'largest',
      title: 'Largest Impact',
      data: highlights.largest,
      icon: HardDrive,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      value: highlights.largest
        ? `+${highlights.largest.additions} -${highlights.largest.deletions}`
        : 'N/A',
      desc: highlights.largest?.title,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, idx) => (
        <motion.a
          key={card.id}
          href={card.data?.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
          className={`group bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all ${card.data ? 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}`}
        >
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={20} />
            </div>
            {card.data && (
              <ArrowRight
                size={16}
                className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
              />
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {card.title}
            </h3>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">{card.value}</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-medium">
              {card.desc || 'No data available'}
            </p>
          </div>
        </motion.a>
      ))}
    </div>
  );
}
