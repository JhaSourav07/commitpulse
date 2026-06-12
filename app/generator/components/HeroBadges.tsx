'use client';

import { Code2, Share2 } from 'lucide-react';
export function HeroBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
      <button
        type="button"
        onClick={() =>
          document.getElementById('technologies-section')?.scrollIntoView({ behavior: 'smooth' })
        }
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55"
      >
        <Code2 className="size-5" />
        200+ technologies
      </button>

      <button
        type="button"
        onClick={() =>
          document.getElementById('socials-section')?.scrollIntoView({ behavior: 'smooth' })
        }
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55"
      >
        <Share2 className="size-5" />
        50+ social platforms
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55"
      >
        Badge recommendations
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 text-[11px] font-medium text-gray-600 dark:text-white/55"
      >
        Live 3D stats
      </button>
    </div>
  );
}
