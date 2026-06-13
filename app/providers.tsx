'use client';

import { TranslationProvider } from '@/context/TranslationContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>;
}
