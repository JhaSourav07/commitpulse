'use client';

import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  TrendingDown,
  GitPullRequest,
  BookOpen,
  MessageCircle,
  CheckCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { BurnoutRecommendation } from '@/utils/calculateBurnoutRisk';

// ---------------------------------------------------------------------------
// Icon resolver — maps string keys to lucide components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  UserPlus,
  TrendingDown,
  GitPullRequest,
  BookOpen,
  MessageCircle,
  CheckCircle,
  Sparkles,
};

function resolveIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Sparkles;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AIRecommendationsPanelProps {
  recommendations: BurnoutRecommendation[];
}

export default function AIRecommendationsPanel({ recommendations }: AIRecommendationsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.02] to-purple-500/[0.02] dark:from-indigo-950/20 dark:to-purple-950/20 relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          AI-Powered Recommendations
        </h3>
      </div>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, i) => {
          const IconComponent = resolveIcon(rec.icon);

          return (
            <motion.div
              key={`${rec.title}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.25 }}
              className="group flex items-start gap-4 p-4 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/30 hover:border-indigo-500/20 dark:hover:border-indigo-400/20 hover:bg-white/80 dark:hover:bg-black/40 transition-all cursor-default"
              tabIndex={0}
              role="article"
              aria-label={`Recommendation: ${rec.title}`}
            >
              {/* Icon */}
              <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform duration-200">
                <IconComponent size={18} />
              </div>

              {/* Content */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                  {rec.title}
                </span>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
