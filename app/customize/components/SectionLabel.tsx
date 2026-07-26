import type { ReactElement, ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }): ReactElement {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-600 dark:text-white/60 mb-2">
      {children}
    </p>
  );
}
