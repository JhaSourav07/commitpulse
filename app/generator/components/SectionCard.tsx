'use client';

import { type ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon?: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}

export function SectionCard({
  title,
  icon,
  description,
  children,
  defaultOpen = true,
  badge,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] overflow-hidden shadow-sm transition-shadow hover:shadow-md dark:shadow-none">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        {icon && <span className="text-lg select-none">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
            {badge !== undefined && badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 dark:text-white/30 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1">
          <div className="h-px bg-gray-100 dark:bg-white/5 mb-4" />
          {children}
        </div>
      )}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-white/50 mb-2">
      {children}
    </p>
  );
}
