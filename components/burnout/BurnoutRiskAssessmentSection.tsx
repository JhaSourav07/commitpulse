'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import BurnoutRiskMeter from '@/components/burnout/BurnoutRiskMeter';
import AIRecommendationsPanel from '@/components/burnout/AIRecommendationsPanel';
import { calculateBurnoutRisk } from '@/utils/calculateBurnoutRisk';
import type { BurnoutRiskInput } from '@/utils/calculateBurnoutRisk';

// ---------------------------------------------------------------------------
// Props — accepts the full BurnoutReport shape from the page
// ---------------------------------------------------------------------------

interface InactivityAlert {
  username: string;
  avatarUrl: string;
  previousAvgWeeklyCommits: number;
  weeksSilent: number;
  severity: 'Medium' | 'High';
}

interface ContributorMetric {
  commitShare: number;
  recentTrend: number[];
}

interface BurnoutReportSlice {
  sustainabilityScore: number;
  busFactor: number;
  dependencyRisk: 'Low' | 'Medium' | 'High';
  contributors: ContributorMetric[];
  inactivityAlerts: InactivityAlert[];
}

interface BurnoutRiskAssessmentSectionProps {
  report: BurnoutReportSlice;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BurnoutRiskAssessmentSection({
  report,
}: BurnoutRiskAssessmentSectionProps) {
  const riskResult = useMemo(() => {
    const input: BurnoutRiskInput = {
      sustainabilityScore: report.sustainabilityScore,
      busFactor: report.busFactor,
      dependencyRisk: report.dependencyRisk,
      contributors: report.contributors.map((c) => ({
        commitShare: c.commitShare,
        recentTrend: c.recentTrend,
      })),
      inactivityAlerts: report.inactivityAlerts.map((a) => ({
        weeksSilent: a.weeksSilent,
        severity: a.severity,
      })),
    };
    return calculateBurnoutRisk(input);
  }, [report]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8"
      aria-labelledby="burnout-risk-heading"
    >
      {/* Section divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Section header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
          <Activity size={12} />
          Risk Assessment
        </div>
        <h2
          id="burnout-risk-heading"
          className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl"
        >
          Burnout Risk Assessment
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md leading-relaxed">
          An instant visual summary of repository sustainability and contributor burnout risk,
          derived from real activity data.
        </p>
      </div>

      {/* Risk Meter — centered */}
      <div className="flex justify-center py-4">
        <BurnoutRiskMeter
          score={riskResult.score}
          level={riskResult.level}
          description={riskResult.description}
        />
      </div>

      {/* AI Recommendations */}
      <AIRecommendationsPanel recommendations={riskResult.recommendations} />
    </motion.section>
  );
}
