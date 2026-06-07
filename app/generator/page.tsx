import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GeneratorClient } from './GeneratorClient';
import { Code2, Share2, Sparkles, BarChart3 } from 'lucide-react';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Profile README Generator | CommitPulse',
  description:
    'Generate a stunning GitHub profile README with your tech stack and social links - no code needed.',
  openGraph: {
    title: 'README Generator | CommitPulse',
    description: 'Build a beautiful GitHub profile README in seconds.',
  },
};

function GeneratorSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-start w-full animate-pulse">
      <div className="w-full lg:w-[44%] xl:w-[42%] flex-shrink-0 space-y-4">
        {[140, 120, 280, 180, 200].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111]"
            style={{ height: h }}
          />
        ))}
      </div>
      <div className="w-full lg:flex-1 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] h-[420px] lg:h-[560px]" />
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]"
      style={{ '--header-h': '3.75rem' } as React.CSSProperties}
    >
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-5 select-none">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
              <path d="M5 0L6.18 3.27H9.51L6.84 5.29L7.93 8.56L5 6.47L2.07 8.56L3.16 5.29L0.49 3.27H3.82L5 0Z" />
            </svg>
            Free · No Sign-up · Open Source
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-4">
            Build your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400">
                GitHub Profile
              </span>
              <span
                className="absolute bottom-0.5 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-emerald-500/60 to-teal-400/60"
                aria-hidden
              />
            </span>{' '}
            README
          </h2>

          <p className="text-sm sm:text-base text-gray-500 dark:text-white/50 max-w-2xl mx-auto leading-relaxed">
            Pick your tech stack, add your social links, and generate a polished GitHub profile
            README in one click.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55 select-none">
              <span className="text-sm leading-none">
                <Code2 className="size-5" />
              </span>
              200+ technologies
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55 select-none">
              <span className="text-sm leading-none">
                <Share2 className="size-5" />
              </span>
              50+ social platforms
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55 select-none">
              <span className="text-sm leading-none">
                <Sparkles className="size-5" />
              </span>
              Badge recommendations
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55 select-none">
              <span className="text-sm leading-none">
                <BarChart3 className="size-5" />
              </span>
              Live 3D stats
            </span>
          </div>
        </div>

        <Suspense fallback={<GeneratorSkeleton />}>
          <GeneratorClient />
        </Suspense>
      </main>

      <div className="mx-auto max-w-7xl px-6 pb-8">
        <Footer />
      </div>
    </div>
  );
}
