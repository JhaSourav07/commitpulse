import { Suspense } from 'react';
import type { Metadata } from 'next';
import CompareClient from './CompareClient';

export const metadata: Metadata = {
  title: 'Compare | CommitPulse',
  description:
    'Compare two GitHub developers side-by-side — streaks, contributions, languages, and 3D monoliths.',
  openGraph: {
    title: 'Compare Developers | CommitPulse',
    description: 'Put two GitHub profiles head-to-head with rich visual comparison.',
  },
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-28 pb-16">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
