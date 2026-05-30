'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContributionReplay from '@/components/ContributionReplay';

export default function ReplayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userFromUrl = searchParams.get('user') ?? '';

  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    router.push(`/replay?user=${trimmed}`);
  };

  if (userFromUrl) {
    return (
      <main className="min-h-screen bg-[#010409] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          {/* Back link */}
          <a
            href="/replay"
            className="inline-flex items-center gap-1.5 text-[#8b949e] hover:text-white text-sm mb-8 transition-colors group"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-0.5 transition-transform"
              aria-hidden="true"
            >
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
            Search another user
          </a>

          <ContributionReplay username={userFromUrl} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#010409] flex items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 text-3xl">
            ⚡
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          Contribution Replay
        </h1>
        <p className="text-[#8b949e] text-sm leading-relaxed mb-10">
          Animate your GitHub contribution history day-by-day with live stats, playback controls,
          and peak streak highlights.
        </p>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b949e]">
              <svg
                height="18"
                width="18"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Enter GitHub username"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={39}
              autoFocus
              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-5 py-4 text-sm text-white placeholder:text-[#8b949e] outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={input.trim().length === 0}
            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-black font-semibold py-4 text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            Start Replay
          </button>
        </form>

        {/* Example hint */}
        <p className="text-[#8b949e] text-xs mt-5">
          Try it with{' '}
          <button
            type="button"
            onClick={() => router.push('/replay?user=torvalds')}
            className="text-emerald-400 hover:underline"
          >
            torvalds
          </button>{' '}
          or{' '}
          <button
            type="button"
            onClick={() => router.push('/replay?user=dhanya-srivastava')}
            className="text-emerald-400 hover:underline"
          >
            dhanya-srivastava
          </button>
        </p>
      </div>
    </main>
  );
}
