'use client';

import { useMemo } from 'react';
import { Lightbulb, Star, Zap, Award, BookOpen } from 'lucide-react';
import type { GeneratorState } from '../types';

interface ReadmeInsightsPanelProps {
  state: GeneratorState;
}

/**
 * Grade thresholds based on completion score:
 *   0–30  → Beginner
 *  31–60  → Intermediate
 *  61–85  → Advanced
 *  86–100 → Pro
 */
interface GradeInfo {
  label: string;
  colorClasses: string;
  icon: React.ReactNode;
}

function getGrade(score: number): GradeInfo {
  if (score >= 86) {
    return {
      label: 'Pro',
      colorClasses:
        'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-emerald-500/10',
      icon: <Award size={13} className="flex-shrink-0" />,
    };
  }
  if (score >= 61) {
    return {
      label: 'Advanced',
      colorClasses: 'text-orange-400 bg-orange-500/15 border-orange-500/30 shadow-orange-500/10',
      icon: <Star size={13} className="flex-shrink-0" />,
    };
  }
  if (score >= 31) {
    return {
      label: 'Intermediate',
      colorClasses: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30 shadow-yellow-500/10',
      icon: <Zap size={13} className="flex-shrink-0" />,
    };
  }
  return {
    label: 'Beginner',
    colorClasses: 'text-blue-400 bg-blue-500/15 border-blue-500/30 shadow-blue-500/10',
    icon: <BookOpen size={13} className="flex-shrink-0" />,
  };
}

/**
 * Computes the same score as CompletionScorePanel to stay in sync
 * without duplicating state management.
 */
function computeScore(state: GeneratorState): number {
  let score = 0;
  if ((state.name || '').trim().length > 0) score += 15;
  if ((state.description || '').trim().length > 0) score += 20;
  if ((state.selectedTechs?.length || 0) >= 3) score += 25;
  if (
    (state.selectedSocials?.length || 0) > 0 &&
    state.selectedSocials.some((id) => (state.socialLinks?.[id] || '').trim().length > 0)
  )
    score += 20;
  if (state.showCommitPulse) score += 10;
  if ((state.githubUsername || '').trim().length > 0) score += 10;
  return score;
}

interface Tip {
  id: string;
  text: string;
}

/**
 * Generates up to 4 actionable tips based on what's missing,
 * prioritised by impact (highest weight items first).
 */
function generateTips(state: GeneratorState): Tip[] {
  const tips: Tip[] = [];

  const techCount = state.selectedTechs?.length || 0;
  const hasName = (state.name || '').trim().length > 0;
  const hasDescription = (state.description || '').trim().length > 0;
  const hasTechs = techCount >= 3;
  const hasSocials =
    (state.selectedSocials?.length || 0) > 0 &&
    state.selectedSocials.some((id) => (state.socialLinks?.[id] || '').trim().length > 0);
  const hasCommitPulse = !!state.showCommitPulse;
  const hasGithubUsername = (state.githubUsername || '').trim().length > 0;

  // Order by weight (highest impact first) so the most valuable tips appear at the top
  if (!hasTechs) {
    tips.push({
      id: 'techs',
      text:
        techCount === 0
          ? 'Add technologies to showcase your skills.'
          : `Add ${3 - techCount} more technolog${3 - techCount === 1 ? 'y' : 'ies'} to better showcase your skills.`,
    });
  }

  if (!hasSocials) {
    tips.push({
      id: 'socials',
      text: 'Connect your social profiles to make collaboration easier.',
    });
  }

  if (!hasDescription) {
    tips.push({
      id: 'description',
      text: 'Add a longer bio/description to improve profile visibility.',
    });
  }

  if (!hasName) {
    tips.push({
      id: 'name',
      text: 'Add your name to personalize your profile.',
    });
  }

  if (!hasCommitPulse) {
    tips.push({
      id: 'commitpulse',
      text: 'Enable CommitPulse badge to display GitHub activity.',
    });
  }

  if (!hasGithubUsername) {
    tips.push({
      id: 'github',
      text: 'Add your GitHub username to link your profile.',
    });
  }

  // If everything is complete, show an encouraging message
  if (tips.length === 0) {
    tips.push({
      id: 'complete',
      text: 'Your README is looking great — all sections are filled!',
    });
  }

  return tips.slice(0, 4);
}

export function ReadmeInsightsPanel({ state }: ReadmeInsightsPanelProps) {
  const insights = useMemo(() => {
    const score = computeScore(state);
    const grade = getGrade(score);
    const tips = generateTips(state);
    return { score, grade, tips };
  }, [state]);

  return (
    <div
      className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm transition-all duration-300 w-full p-5 flex flex-col gap-4"
      aria-label="README Insights"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb size={15} className="text-amber-400" />
          README Insights
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5 transition-colors duration-300 ${insights.grade.colorClasses}`}
        >
          {insights.grade.icon}
          {insights.grade.label}
        </span>
      </div>

      {/* Suggested Improvements */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
          Suggested Improvements
        </span>
        <ul className="flex flex-col gap-2" role="list">
          {insights.tips.map((tip) => (
            <li
              key={tip.id}
              className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-white/70 py-1 transition-all duration-300"
            >
              <span
                className={`mt-0.5 flex-shrink-0 h-1.5 w-1.5 rounded-full ${
                  tip.id === 'complete' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                aria-hidden="true"
              />
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
