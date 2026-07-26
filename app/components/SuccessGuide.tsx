'use client';

import { motion } from 'framer-motion';
import { CloseIcon } from './Icons';
import { useTranslation } from '@/context/TranslationContext';

type SuccessGuideProps = {
  markdown: string;
  onDismiss: () => void;
};

export function SuccessGuide({ markdown, onDismiss }: SuccessGuideProps) {
  const { t } = useTranslation();

  const steps = [
    {
      n: '01',
      title: t('success_guide.step_1_title'),
      body: t('success_guide.step_1_body'),
    },
    {
      n: '02',
      title: t('success_guide.step_2_title'),
      body: t('success_guide.step_2_body'),
    },
    {
      n: '03',
      title: t('success_guide.step_3_title'),
      body: t('success_guide.step_3_body'),
    },
    {
      n: '04',
      title: t('success_guide.step_4_title'),
      body: t('success_guide.step_4_body'),
    },
  ];

  return (
    <motion.div
      key="success-guide"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="max-w-4xl mx-auto mb-12"
    >
      <div
        role="region"
        aria-labelledby="success-guide-heading"
        className="relative rounded-[2rem] border border-emerald-500/20 bg-[#050505]/80 backdrop-blur-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 60px -10px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.08) inset',
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"
        />

        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-0.5">
                {t('success_guide.markdown_copied')}
              </p>
              <h2
                id="success-guide-heading"
                className="text-2xl font-extrabold text-white tracking-tight"
              >
                {t('success_guide.title')}
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="ml-4 mt-1 shrink-0 p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Dismiss guide"
          >
            <CloseIcon />
          </button>
        </div>

        <div
          aria-label="Steps to embed your badge"
          className="grid sm:grid-cols-2 gap-px bg-white/5 border-b border-white/5"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="bg-[#050505] p-6 flex gap-4"
            >
              <span className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center tracking-widest">
                {step.n}
              </span>
              <div>
                <p className="font-bold text-white text-sm mb-1">{step.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-8 py-6">
          <p className="text-xs uppercase tracking-[0.15em] text-white/30 font-bold mb-3">
            {t('success_guide.copied_snippet_label')}
          </p>
          <div className="flex items-center gap-3 bg-black/60 border border-white/8 rounded-xl px-4 py-3 font-mono text-sm">
            <span aria-hidden="true" className="text-emerald-400/60 select-none shrink-0">
              $
            </span>
            <code
              aria-label="Your badge markdown snippet"
              className="text-emerald-300 break-all leading-relaxed flex-1 overflow-x-auto"
            >
              {markdown}
            </code>
          </div>
          <p className="mt-4 text-xs text-white/25 leading-relaxed">
            {t('success_guide.color_tip')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
