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
// Icon resolver
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
// Animation Variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delayChildren: 0.15,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AIRecommendationsPanelProps {
  recommendations: BurnoutRecommendation[];
}

export default function AIRecommendationsPanel({ recommendations }: AIRecommendationsPanelProps) {
  // Early return or fallback for empty states
  if (!recommendations || recommendations.length === 0) {
    return null; // Or return a designed "No recommendations right now" state
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
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
          // Note: Use `rec.id` instead of index if available in your type!
          const uniqueKey = 'id' in rec ? (rec as any).id : `${rec.title}-${i}`; 

          return (
            <motion.div
              key={uniqueKey}
              variants={itemVariants}
              className="group flex items-start gap-4 p-4 rounded-xl border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/30 hover:border-indigo-500/20 dark:hover:border-indigo-400/20 hover:bg-white/80 dark:hover:bg-black/40 transition-all cursor-default"
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
