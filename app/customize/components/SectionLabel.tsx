import type { ReactElement, ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }): ReactElement {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/30 mb-2">
      {children}
    </p>
  );
}
