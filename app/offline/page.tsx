import type { Metadata } from 'next';
import OfflineFallback from '@/components/pwa/OfflineFallback';

export const metadata: Metadata = {
  title: 'Offline | CommitPulse',
  description: 'Connection lost. Please check your internet connection.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return <OfflineFallback />;
}
