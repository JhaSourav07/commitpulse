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
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const isRateLimit = error.message.includes('API limit') || error.message.includes('rate limit');
  const isNotFound = error.message.includes('not found');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-md w-full relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/20 blur-[60px] rounded-full" />

        <h2 className="text-4xl mb-4">{isNotFound ? '🕵️‍♂️' : isRateLimit ? '⏳' : '⚠️'}</h2>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isNotFound
            ? 'User Not Found'
            : isRateLimit
              ? 'API Limit Reached'
              : 'Something went wrong'}
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          {isNotFound
            ? "We couldn't find a GitHub user with that username. Please check the spelling and try again."
            : isRateLimit
              ? "GitHub's API rate limit has been reached. Please add a GITHUB_TOKEN to your environment variables to increase the limit, or try again later."
              : error.message || 'An unexpected error occurred while fetching the dashboard data.'}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
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
