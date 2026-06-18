'use client';

import { useMemo, useCallback } from 'react';
import { Activity, CheckCircle2, Circle } from 'lucide-react';
import type { GeneratorState } from '../types';

interface ReadmeHealthBreakdownProps {
  state: GeneratorState;
}

interface HealthItem {
  key: string;
  label: string;
  completed: boolean;
  sectionId: string;
}

const SECTION_IDS: Record<string, string> = {
  name: 'name-section',
  description: 'description-section',
  technologies: 'technologies-section',
  socials: 'socials-section',
  github: 'commitpulse-section',
  commitpulse: 'commitpulse-section',
};

function getHealthItems(state: GeneratorState): HealthItem[] {
  const hasName = (state.name || '').trim().length > 0;
  const hasDescription = (state.description || '').trim().length > 0;
  const hasTechs = (state.selectedTechs?.length || 0) >= 1;
  const hasSocials =
    (state.selectedSocials?.length || 0) > 0 &&
    state.selectedSocials.some((id) => (state.socialLinks?.[id] || '').trim().length > 0);
  const hasGithub = (state.githubUsername || '').trim().length > 0;
  const hasCommitPulse = !!state.showCommitPulse;

  return [
    { key: 'name', label: 'Name', completed: hasName, sectionId: SECTION_IDS.name },
    {
      key: 'description',
      label: 'Description',
      completed: hasDescription,
      sectionId: SECTION_IDS.description,
    },
    {
      key: 'technologies',
      label: 'Technologies',
      completed: hasTechs,
      sectionId: SECTION_IDS.technologies,
    },
    {
      key: 'socials',
      label: 'Social Links',
      completed: hasSocials,
      sectionId: SECTION_IDS.socials,
    },
    {
      key: 'github',
      label: 'GitHub Username',
      completed: hasGithub,
      sectionId: SECTION_IDS.github,
    },
    {
      key: 'commitpulse',
      label: 'CommitPulse Badge',
      completed: hasCommitPulse,
      sectionId: SECTION_IDS.commitpulse,
    },
  ];
}

export function ReadmeHealthBreakdown({ state }: ReadmeHealthBreakdownProps) {
  const items = useMemo(
    () => getHealthItems(state),
    [
      state.name,
      state.description,
      state.selectedTechs,
      state.selectedSocials,
      state.socialLinks,
      state.showCommitPulse,
      state.githubUsername,
    ]
  );

  const completedCount = items.filter((i) => i.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const missingItems = items.filter((i) => !i.completed);

  const scrollTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  /* Colour for the progress bar fill */
  const barColor =
    percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';

  const percentColor =
    percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm transition-all duration-300 w-full p-5 flex flex-col gap-4"
      aria-label="README Health Breakdown"
    >
      {/* Header + progress */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity size={15} className="text-cyan-400" />
          README Health Breakdown
        </h3>
        <span className={`text-xs font-bold tabular-nums ${percentColor}`}>{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="flex flex-col gap-1.5" role="list">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center gap-2.5 text-xs py-1 transition-all duration-200"
          >
            {item.completed ? (
              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle size={14} className="text-gray-400 dark:text-white/20 flex-shrink-0" />
            )}
            <span
              className={
                item.completed
                  ? 'text-gray-700 dark:text-white/70'
                  : 'text-gray-400 dark:text-white/35'
              }
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Quick fixes */}
      {missingItems.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
            Quick Fixes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {missingItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => scrollTo(item.sectionId)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer"
              >
                + Add {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
