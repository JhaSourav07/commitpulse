'use client';

import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityData } from '@/types/dashboard';

// Lazy-load the 3D city so it never touches the SSR bundle
const ContributionCity3D = lazy(() => import('./ContributionCity3D'));

interface ViewToggle3DProps {
  data: ActivityData[];
  theme?: string;
  /** If provided, renders a static 2D view (e.g. SVG img) as the default */
  flatViewSlot?: React.ReactNode;
}

const ICON_3D = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 2 L14 5.5 L14 10.5 L8 14 L2 10.5 L2 5.5 Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <path
      d="M8 2 L8 14 M2 5.5 L14 5.5"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 1.5"
      opacity="0.5"
    />
  </svg>
);

const ICON_2D = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="2" y="11" width="2" height="3" rx="0.5" fill="currentColor" />
    <rect x="5" y="8" width="2" height="6" rx="0.5" fill="currentColor" />
    <rect x="8" y="5" width="2" height="9" rx="0.5" fill="currentColor" />
    <rect x="11" y="9" width="2" height="5" rx="0.5" fill="currentColor" />
    <line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
);

const THEME_ACCENT: Record<string, string> = {
  dark: '#58a6ff',
  neon: '#ff00ff',
  dracula: '#bd93f9',
  synthwave: '#ff2d78',
  ocean: '#64ffda',
  forest: '#39d353',
  github: '#238636',
  rose: '#ff6b9d',
  nord: '#88c0d0',
  sunset: '#ff6b35',
};

function City3DFallback({ accent }: { accent: string }) {
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height: 360, background: 'rgba(0,0,0,0.3)', borderRadius: 12 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${accent}44`, borderTopColor: accent }}
        />
        <span className="text-xs opacity-50" style={{ color: accent }}>
          Rendering city…
        </span>
      </div>
    </div>
  );
}

export default function ViewToggle3D({ data, theme = 'dark', flatViewSlot }: ViewToggle3DProps) {
  const [is3D, setIs3D] = useState(false);
  const accent = THEME_ACCENT[theme] ?? '#58a6ff';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Toggle bar */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs opacity-40 mr-1">View</span>
        <div className="group relative flex justify-center">
          <button
            onClick={() => setIs3D(false)}
            aria-pressed={!is3D}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            style={{
              background: !is3D ? `${accent}22` : 'transparent',
              color: !is3D ? accent : 'currentColor',
              border: `1px solid ${!is3D ? accent + '55' : 'transparent'}`,
            }}
          >
            {ICON_2D}
            <span>Flat</span>
          </button>

          {/* Custom Tooltip */}
          <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 flex flex-col items-center opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
            <div className="w-2 h-2 bg-gray-950 dark:bg-zinc-800 border-l border-t border-white/10 dark:border-white/5 rotate-45 -mb-1 z-10" />
            <div className="whitespace-nowrap rounded-lg bg-gray-950 dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-white dark:text-zinc-100 shadow-xl border border-white/10 dark:border-white/5">
              Switch to flat view
            </div>
          </div>
        </div>

        <div className="group relative flex justify-center">
          <button
            onClick={() => setIs3D(true)}
            aria-pressed={is3D}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            style={{
              background: is3D ? `${accent}22` : 'transparent',
              color: is3D ? accent : 'currentColor',
              border: `1px solid ${is3D ? accent + '55' : 'transparent'}`,
            }}
          >
            {ICON_3D}
            <span>3D City</span>
          </button>

          {/* Custom Tooltip */}
          <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 flex flex-col items-center opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
            <div className="w-2 h-2 bg-gray-950 dark:bg-zinc-800 border-l border-t border-white/10 dark:border-white/5 rotate-45 -mb-1 z-10" />
            <div className="whitespace-nowrap rounded-lg bg-gray-950 dark:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-white dark:text-zinc-100 shadow-xl border border-white/10 dark:border-white/5">
              Switch to 3D City view
            </div>
          </div>
        </div>
      </div>

      {/* View area */}
      <AnimatePresence mode="wait">
        {is3D ? (
          <motion.div
            key="3d"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22 }}
          >
            <Suspense fallback={<City3DFallback accent={accent} />}>
              <ContributionCity3D data={data} theme={theme} />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="flat"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22 }}
          >
            {flatViewSlot ?? (
              <div
                className="w-full flex items-center justify-center opacity-30 text-sm"
                style={{ height: 120 }}
              >
                No flat view provided
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
