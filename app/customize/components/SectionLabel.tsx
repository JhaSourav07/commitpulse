import type { ReactElement, ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }): ReactElement {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-2 leading-none">
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600 dark:text-white/60 mb-2">
      {children}
    </p>
  );
}
