// app/(root)/dashboard/[username]/page.tsx

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

import RefreshButton from '@/components/dashboard/RefreshButton';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ActivityLandscape from '@/components/dashboard/ActivityLandscape';
import StatsCard from '@/components/dashboard/StatsCard';
import LanguageChart from '@/components/dashboard/LanguageChart';
import CommitClock from '@/components/dashboard/CommitClock';
import Heatmap from '@/components/dashboard/Heatmap';
import AIInsights from '@/components/dashboard/AIInsights';
import Achievements from '@/components/dashboard/Achievements';
import { getFullDashboardData, fetchUserProfile } from '@/lib/github';

export const revalidate = 3600; // Cache for 1 hour

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const ogImage = `${BASE_URL}/api/og?user=${username}`;
  const title = `${username}'s Commit Pulse`;
  const description = `Check out ${username}'s GitHub contribution pulse — streaks, insights, and more on CommitPulse.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/dashboard/${username}`,
      siteName: 'CommitPulse',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: `@${username}`,
    },
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { username } = await params;
  const refreshParams = await searchParams;
  const bypassCache = refreshParams?.refresh === 'true';

  let data;

  try {
    data = await getFullDashboardData(username, { bypassCache });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      // Smart Redirect: If the GraphQL "user" query fails, check if it's actually an Organization
      try {
        const fallbackProfile = await fetchUserProfile(username, { bypassCache });
        if (fallbackProfile.type === 'Organization') {
          redirect(`/dashboard/org/${username}`);
        }
      } catch {
        // If it's truly neither a user nor an org, show 404
        return notFound();
      }
      return notFound();
    }
    throw error;
  }

  return (
    <div id="dashboard-root" data-dashboard className="p-4 md:p-6 lg:p-8 min-h-screen relative">
      <div id="generate-dashboard-btn" className="flex justify-end gap-4 mb-6">
        <RefreshButton username={username} />
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-black dark:bg-black px-4 py-2 text-sm font-semibold text-white dark:text-white transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Generate Your Own
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar */}
        <aside className="flex flex-col gap-6">
          <ProfileCard
            user={data.profile}
            exportData={{
              stats: data.stats,
              languages: data.languages,
            }}
          />
          <Achievements achievements={data.achievements} />
        </aside>

        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <section>
            <ActivityLandscape data={data.activity} />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LanguageChart languages={data.languages} />
            <CommitClock data={data.commitClock} />
          </section>

          <section>
            <Heatmap data={data.activity} />
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <StatsCard
              title="Current Streak"
              value={data.stats.currentStreak.toString()}
              description="Days"
              icon="Flame"
              showUTCDisclaimer={true}
              utcDate={new Date().toISOString().split('T')[0]}
            />

            <StatsCard
              title="Peak Streak"
              value={data.stats.peakStreak.toString()}
              description="Days"
              icon="TrendingUp"
            />

            <StatsCard
              title="Contributions"
              value={data.stats.totalContributions.toString()}
              description="Last 365 Days"
              icon="GitCommit"
            />
          </div>

          <AIInsights insights={data.insights} />
        </aside>
      </div>
    </div>
  );
}
