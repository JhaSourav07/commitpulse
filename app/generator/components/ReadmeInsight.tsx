'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import type { GeneratorState } from '../types';

interface ReadmeInsightProps {
  state: GeneratorState;
}

export function ReadmeInsight({ state }: ReadmeInsightProps) {
  const activeTip = useMemo(() => {
    const hasName = (state.name || '').trim().length > 0;
    const hasDescription = (state.description || '').trim().length > 0;
    const hasSocials =
      (state.selectedSocials?.length || 0) > 0 &&
      state.selectedSocials.some((id) => (state.socialLinks?.[id] || '').trim().length > 0);
    const hasCommitPulse = !!state.showCommitPulse;

    if (!hasDescription) {
      return { text: 'Improve description clarity', boost: '+20%' };
    }
    if (!hasCommitPulse) {
      return { text: 'Add badges for credibility', boost: '+10%' };
    }
    if (!hasSocials) {
      return { text: 'Include social links', boost: '+20%' };
    }
    if (!hasName) {
      return { text: 'Add badges for credibility', boost: '+15%' };
    }

    // Default fallback
    return { text: 'Add installation steps', boost: '+15%' };
  }, [
    state.name,
    state.description,
    state.selectedSocials,
    state.socialLinks,
    state.showCommitPulse,
  ]);

  return (
    <div
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm hover:border-cyan-500/30 hover:shadow-md dark:hover:shadow-cyan-500/5 transition-all duration-300 w-full p-4 flex flex-col gap-3"
      aria-label="README Insight"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
        <Sparkles size={14} className="text-cyan-500 dark:text-cyan-400 animate-pulse" />
        <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          README Insight
        </h3>
      </div>

      {/* Tip & Badge Content */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs text-gray-700 dark:text-white/80 font-medium leading-relaxed">
          💡 {activeTip.text}
        </p>
        <div className="flex">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Health Boost {activeTip.boost}
          </span>
        </div>
      </div>
    </div>
  );
}
