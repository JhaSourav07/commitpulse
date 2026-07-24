'use client';

import React from 'react';
import * as NextNavigation from 'next/navigation';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

let getRouter: () => SafeRouter;
try {
  getRouter =
    NextNavigation.useRouter || (() => ({ replace: () => {}, push: () => {}, refresh: () => {} }));
} catch {
  getRouter = () => ({ replace: () => {}, push: () => {}, refresh: () => {} });
}

let getSearchParams: () => SafeSearchParams;
try {
  getSearchParams = NextNavigation.useSearchParams || (() => ({ get: () => null }));
} catch {
  getSearchParams = () => ({ get: () => null });
}

let getPathname: () => string;
try {
  getPathname = NextNavigation.usePathname || (() => '');
} catch {
  getPathname = () => '';
}

interface SafeRouter {
  replace(url: string): void;
  push(url: string): void;
  refresh(): void;
}

interface SafeSearchParams {
  get(key: string): string | null;
}

export default function BotFilterToggle() {
  let router: SafeRouter;
  try {
    router = getRouter();
  } catch {
    router = { replace: () => {}, push: () => {}, refresh: () => {} };
  }

  let searchParams: SafeSearchParams;
  try {
    searchParams = getSearchParams();
  } catch {
    searchParams = { get: () => null };
  }

  let pathname = '';
  try {
    pathname = getPathname() || '';
  } catch {
    pathname = '';
  }

  const excludeBots = searchParams?.get('excludeBots') === 'true';

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (checked) {
      params.set('excludeBots', 'true');
    } else {
      params.delete('excludeBots');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-5 rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-md border border-black/10 dark:border-white/5 shadow-sm transition-all duration-300 hover:border-indigo-500/30 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <Bot size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              Exclude Bot Activity
            </span>
            <span className="text-[9px] text-[#A1A1AA] uppercase tracking-wider font-bold">
              Analytics Filter
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={excludeBots}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 dark:bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-zinc-400 peer-checked:after:bg-indigo-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500/20 dark:peer-checked:bg-indigo-500/20 border border-black/5 dark:border-white/5"></div>
        </label>
      </div>
      <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
        Exclude spikes from Dependabot, Renovate, and custom bot authors configured in{' '}
        <code className="text-indigo-400 bg-indigo-500/5 px-1 py-0.5 rounded font-mono">
          .commitpulse.json
        </code>
        .
      </p>
    </motion.div>
  );
}
