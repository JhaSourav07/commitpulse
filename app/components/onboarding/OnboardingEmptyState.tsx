'use client';

import { motion } from 'framer-motion';
import { AnimatedStatCards } from './AnimatedStatCards';
import { HowItWorks } from './HowItWorks';
import { SAMPLE_PREVIEW_USERNAME } from './constants';

type OnboardingEmptyStateProps = {
  onTryDemo: (username: string) => void;
};

export function OnboardingEmptyState({ onTryDemo }: OnboardingEmptyStateProps) {
  const sampleBadgeUrl = `/api/streak?user=${SAMPLE_PREVIEW_USERNAME}`;

  return (
    <div
      className="flex w-full flex-col items-center gap-8"
      data-testid="onboarding-empty-state"
    >
      <div className="relative w-full max-w-[700px]">
        <span className="absolute left-3 top-3 z-10 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Sample preview
        </span>
        <motion.img
          src={sampleBadgeUrl}
          alt={`Sample CommitPulse badge for ${SAMPLE_PREVIEW_USERNAME}`}
          data-testid="sample-badge-img"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full rounded-2xl opacity-90 drop-shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        />
      </div>

      <AnimatedStatCards />

      <HowItWorks />

      <p className="max-w-md text-center text-sm text-gray-500 dark:text-white/55">
        Enter a username above or{' '}
        <button
          type="button"
          onClick={() => onTryDemo(SAMPLE_PREVIEW_USERNAME)}
          className="font-semibold text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          try the {SAMPLE_PREVIEW_USERNAME} demo
        </button>{' '}
        to replace this sample with your own badge.
      </p>
    </div>
  );
}
