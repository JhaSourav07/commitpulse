'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isRateLimit = error.message.includes('API limit') || error.message.includes('rate limit');

  const isNotFound = error.message.includes('not found');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-8 rounded-3xl bg-white/80 border border-black/10 backdrop-blur-xl dark:bg-white/5 dark:border-white/10 max-w-md w-full relative overflow-hidden shadow-xl dark:shadow-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-400/10 dark:bg-pink-500/20 blur-[60px] rounded-full" />

        <h2 className="text-4xl mb-4">{isNotFound ? '🕵️‍♂️' : isRateLimit ? '⏳' : '⚠️'}</h2>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isNotFound
            ? 'User Not Found'
            : isRateLimit
              ? 'API Limit Reached'
              : 'Something went wrong'}
        </h1>

        <p className="text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
          {isNotFound
            ? "We couldn't find a GitHub user with that username. Please check the spelling and try again."
            : isRateLimit
              ? "GitHub's API rate limit has been reached. Please add a GITHUB_TOKEN to your environment variables to increase the limit, or try again later."
              : error.message || 'An unexpected error occurred while fetching the dashboard data.'}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-black text-white hover:bg-zinc-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-medium transition-colors"
          >
            Try again
          </button>

          <Link href="/">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">
              Go back home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
