'use client';

import { useMemo } from 'react';
import { Check, AlertCircle, Trophy, Sparkles } from 'lucide-react';
import type { GeneratorState } from '../types';

interface CompletionScorePanelProps {
  state: GeneratorState;
}

export function CompletionScorePanel({ state }: CompletionScorePanelProps) {
  const scoreDetails = useMemo(() => {
    const nameAdded = (state.name || '').trim().length > 0;
    const descriptionAdded = (state.description || '').trim().length > 0;
    const techCount = state.selectedTechs?.length || 0;
    const techsAdded = techCount >= 3;
    const socialsAdded =
      (state.selectedSocials?.length || 0) > 0 &&
      state.selectedSocials.some((id) => (state.socialLinks?.[id] || '').trim().length > 0);
    const commitPulseEnabled = !!state.showCommitPulse;
    const githubUsernameAdded = (state.githubUsername || '').trim().length > 0;

    let score = 0;
    if (nameAdded) score += 15;
    if (descriptionAdded) score += 20;
    if (techsAdded) score += 25;
    if (socialsAdded) score += 20;
    if (commitPulseEnabled) score += 10;
    if (githubUsernameAdded) score += 10;

    // Levels
    // 0 - 30   → Beginner
    // 31 - 60  → Growing
    // 61 - 80  → Advanced
    // 81 - 100 → Pro Developer
    let level = 'Beginner';
    let levelColor = 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    let progressBarColor = 'bg-blue-500';
    let strength = 'Poor';
    let strengthColor = 'text-red-500 dark:text-red-400';

    if (score > 30 && score <= 60) {
      level = 'Growing';
      levelColor = 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      progressBarColor = 'bg-yellow-500';
      strength = 'Fair';
      strengthColor = 'text-yellow-600 dark:text-yellow-400';
    } else if (score > 60 && score <= 80) {
      level = 'Advanced';
      levelColor = 'text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20';
      progressBarColor = 'bg-orange-500';
      strength = 'Good';
      strengthColor = 'text-orange-500 dark:text-orange-400';
    } else if (score > 80) {
      level = 'Pro Developer';
      levelColor = 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      progressBarColor = 'bg-emerald-500';
      strength = 'Excellent';
      strengthColor = 'text-emerald-500 dark:text-emerald-400';
    }

    // Suggestions List
    const suggestions = [
      {
        id: 'name',
        completed: nameAdded,
        text: nameAdded ? 'Name Added' : 'Add your name to personalize your profile.',
      },
      {
        id: 'description',
        completed: descriptionAdded,
        text: descriptionAdded
          ? 'Description Added'
          : 'Add a short developer bio to improve profile visibility.',
      },
      {
        id: 'techs',
        completed: techsAdded,
        text: techsAdded
          ? 'Technologies Added'
          : techCount === 0
            ? 'Add technologies to showcase your skills.'
            : 'Add more technologies to better showcase your skills.',
      },
      {
        id: 'socials',
        completed: socialsAdded,
        text: socialsAdded
          ? 'Social Links Added'
          : 'Connect your social profiles to make collaboration easier.',
      },
      {
        id: 'commitpulse',
        completed: commitPulseEnabled,
        text: commitPulseEnabled
          ? 'CommitPulse Badge Enabled'
          : 'Enable CommitPulse badge to display GitHub activity.',
      },
      {
        id: 'github',
        completed: githubUsernameAdded,
        text: githubUsernameAdded
          ? 'GitHub Username Added'
          : 'Add your GitHub username to link your profile.',
      },
    ];

    return {
      score,
      level,
      levelColor,
      progressBarColor,
      strength,
      strengthColor,
      suggestions,
    };
  }, [
    state.name,
    state.description,
    state.selectedTechs,
    state.selectedSocials,
    state.socialLinks,
    state.showCommitPulse,
    state.githubUsername,
  ]);

  return (
    <div
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm transition-all duration-300 w-full p-5 flex flex-col gap-4"
      aria-label="README Completion Score Details"
    >
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📊</span> README Completion Score
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreDetails.levelColor} flex items-center gap-1`}
        >
          <Trophy size={12} className="flex-shrink-0" />
          Level: {scoreDetails.level}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-white/40">
            Profile Completeness
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white" aria-live="polite">
            {scoreDetails.score}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={scoreDetails.score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-3 overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${scoreDetails.progressBarColor}`}
            style={{ width: `${scoreDetails.score}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
          Suggestions &amp; Checklist
        </span>
        <ul className="flex flex-col gap-2" role="list">
          {scoreDetails.suggestions.map((item) => (
            <li
              key={item.id}
              className={`flex items-start gap-2.5 text-xs transition-colors py-1 ${
                item.completed
                  ? 'text-gray-500 dark:text-white/40'
                  : 'text-gray-700 dark:text-white/70'
              }`}
            >
              {item.completed ? (
                <Check
                  size={14}
                  className="text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  size={14}
                  className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              <span
                className={
                  item.completed ? 'line-through decoration-gray-300 dark:decoration-white/10' : ''
                }
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-1.5 border-t border-gray-100 dark:border-white/5 pt-3 mt-1 text-xs">
        <Sparkles size={13} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-gray-500 dark:text-white/40">Estimated Profile Strength:</span>
        <strong className={`font-bold ${scoreDetails.strengthColor}`}>
          {scoreDetails.strength}
        </strong>
      </div>
    </div>
  );
}
