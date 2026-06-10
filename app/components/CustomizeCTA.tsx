'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from '@/context/TranslationContext';

export function CustomizeCTA() {
  const { t } = useTranslation();
  return (
    <motion.div
      id="customization-studio"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-4xl mx-auto mb-16"
    >
      <div className="group relative rounded-[2rem] border border-black/10 bg-white overflow-hidden transition-all duration-700 hover:border-black/20 dark:border-white/5 dark:bg-[#0a0a0a] dark:hover:border-white/10">
        {/* Hover glow layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

        {/* Ambient blobs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-10">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 mb-3">
              {t('customize_cta.studio_badge')}
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white tracking-tight mb-3 leading-snug">
              {t('customize_cta.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-500 text-sm leading-relaxed max-w-lg">
              {t('customize_cta.desc')}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/customize"
              id="open-customization-studio-cta"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 rounded-2xl"
            >
              <span className="relative inline-flex items-center gap-2 px-4 md:px-7 py-4 rounded-2xl border border-black/10 dark:border-white/10 font-bold text-sm text-black dark:text-black bg-gray-100 dark:bg-white hover:bg-gray-200 dark:hover:bg-zinc-100 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-[0_0_30px_-4px_rgba(255,255,255,0.12)] cursor-pointer select-none">
                {/* Button shimmer */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-white to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-700"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
                {t('customize_cta.btn')}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
