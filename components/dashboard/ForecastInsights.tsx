'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import type { ForecastResult } from '@/utils/ForecastEngine';

interface ForecastInsightsProps {
  forecast: ForecastResult;
}

export default function ForecastInsights({ forecast }: ForecastInsightsProps) {
  const getInsightText = () => {
    switch (forecast.trendType) {
      case 'strong_growth':
        return {
          title: 'Exceptional Momentum!',
          body: 'Your weekly contribution velocity is accelerating. At this rate, you will easily hit your projected milestones early.',
          tip: 'Consider taking on larger open source features or mentor others while your rhythm is peaking.',
        };
      case 'moderate_growth':
        return {
          title: 'Steady Progress',
          body: 'You are showing stable upward growth in daily commits. Consistency is high.',
          tip: 'Focus on maintaining your daily streak to build long-term momentum.',
        };
      case 'cooling':
      case 'decline':
        return {
          title: 'Coding Rhythm Cooling Down',
          body: 'Your velocity has dipped below your historical average. Your streak might be at risk.',
          tip: 'Schedule small, dedicated 15-minute slots to commit docs, tests, or minor refactors to restore consistency.',
        };
      default:
        return {
          title: 'Balanced Coding Rhythm',
          body: 'Your daily contribution counts are highly predictable and steady.',
          tip: 'Try learning a new skill category or contributing to another repo to trigger new growth.',
        };
    }
  };

  const insight = getInsightText();

  return (
    <div className="mt-5 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/20 space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
        <Sparkles size={14} />
        <span>AI Forecast Insight: {insight.title}</span>
      </div>
      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {insight.body}
      </p>
      <div className="flex items-start gap-2 pt-2 border-t border-amber-500/10 text-[11px] text-zinc-500 dark:text-zinc-400">
        <ArrowRight size={12} className="mt-0.5 text-amber-500" />
        <span><strong>Tip:</strong> {insight.tip}</span>
      </div>
    </div>
  );
}
