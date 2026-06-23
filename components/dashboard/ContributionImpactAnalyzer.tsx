'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';
import { useTranslation } from '@/context/TranslationContext';
import { calculateContributionImpact } from '@/utils/ImpactScoreEngine';
import ImpactBreakdownPanel from './ImpactBreakdownPanel';

interface ContributionImpactAnalyzerProps {
  data: DashboardData;
}

export default function ContributionImpactAnalyzer({
  data,
}: ContributionImpactAnalyzerProps) {
  const { t } = useTranslation();

  const analysis = useMemo(() => {
    return calculateContributionImpact(data);
  }, [data]);

  const { overallScore, grade, breakdown, influenceLevel } = analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-5 border-b border-black/5 dark:border-white/5 pb-4">
        <Compass size={18} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {t('dashboard.impact_analyzer.title') || 'Contribution Impact Analyzer'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] mt-0.5">
            {t('dashboard.impact_analyzer.subtitle') || 'Measure total code and repository footprint score.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Main Grade Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#111] rounded-xl border border-black/5 dark:border-white/5 text-center">
          <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-widest font-bold">
            {t('dashboard.impact_analyzer.grade') || 'Contribution Grade'}
          </span>
          <div className="relative mt-3 mb-2 flex items-center justify-center h-24 w-24 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tighter">
              {grade}
            </span>
            <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full text-white">
              <Sparkles size={12} />
            </div>
          </div>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">
            {influenceLevel} Influence Score: {overallScore}/100
          </span>
        </div>

        {/* Breakdown Display */}
        <div className="md:col-span-2 space-y-4">
          <ImpactBreakdownPanel breakdown={breakdown} />
        </div>
      </div>
    </motion.div>
  );
}
