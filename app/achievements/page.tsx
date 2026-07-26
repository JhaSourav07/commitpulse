import type { Metadata } from 'next';
import AchievementsClient from './AchievementsClient';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Achievements - Commit Pulse',
  description: 'Unlock developer achievements and track your GitHub gamification progress',
};

export default function AchievementsPage() {
  return (
    <>
      <AchievementsClient />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <Footer />
      </div>
    </>
  );
}
