'use client';

import { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

export default function OfflineFallback() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetry = () => {
    setIsRefreshing(true);
    // Attempt reload
    window.location.reload();
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 shadow-md">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-50 blur-lg" />
        <WifiOff className="relative h-12 w-12 text-zinc-400 dark:text-zinc-500" />
      </div>

      <h1 className="mb-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-white md:text-4xl">
        {t('offline.title', { defaultValue: 'Connection Lost' })}
      </h1>

      <p className="mx-auto mb-8 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        {t('offline.description', {
          defaultValue:
            'You are currently offline. Check your internet connection and try refreshing the page.',
        })}
      </p>

      <button
        onClick={handleRetry}
        disabled={isRefreshing}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-black transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {t('offline.retry_button', { defaultValue: 'Try Again' })}
      </button>
    </div>
  );
}
