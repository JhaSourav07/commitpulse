'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/context/TranslationContext';
import type { ImpactBreakdown } from '@/utils/ImpactScoreEngine';

interface ImpactBreakdownPanelProps {
  breakdown: ImpactBreakdown;
}

export default function ImpactBreakdownPanel({
  breakdown,
}: ImpactBreakdownPanelProps) {
  const { t } = useTranslation();

  const metrics = [
    {
      key: 'codeFootprint',
      label: t('dashboard.impact_analyzer.code_footprint') || 'Code Footprint',
      score: breakdown.codeFootprint,
      color: 'bg-cyan-500',
    },
    {
      key: 'issueResolution',
      label: t('dashboard.impact_analyzer.issue_resolution') || 'Issue/PR Activity',
      score: breakdown.issueResolution,
      color: 'bg-purple-500',
    },
    {
      key: 'collaboration',
      label: t('dashboard.impact_analyzer.collaboration') || 'Collaboration Density',
      score: breakdown.collaboration,
      color: 'bg-emerald-500',
    },
    {
      key: 'communityInfluence',
      label: t('dashboard.impact_analyzer.community_influence') || 'Community Influence',
      score: breakdown.communityInfluence,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
        {t('dashboard.impact_analyzer.breakdown') || 'Impact Breakdown'}
      </h4>
      <div className="grid grid-cols-1 gap-4">
        {metrics.map((m) => (
          <div key={m.key} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">{m.label}</span>
              <span className="text-zinc-900 dark:text-white">{m.score}/100</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.score}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${m.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
