import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProfileCard from '@/components/dashboard/ProfileCard';
import ActivityLandscape from '@/components/dashboard/ActivityLandscape';
import StatsCard from '@/components/dashboard/StatsCard';
import LanguageChart from '@/components/dashboard/LanguageChart';
import CommitClock from '@/components/dashboard/CommitClock';
import Heatmap from '@/components/dashboard/Heatmap';
import AIInsights from '@/components/dashboard/AIInsights';
import Achievements from '@/components/dashboard/Achievements';
import { getFullDashboardData } from '@/lib/github';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // Cache for 1 hour

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  // Lightweight — no API calls here.
  // Real data is fetched by /api/og on demand when social platforms render the preview.
  const { username } = await params;
  const ogImage = `${BASE_URL}/api/og?username=${username}`;
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
async function ActivityLandscapeSection({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getFullDashboardData>;
}) {
  const data = await dataPromise;

  return <ActivityLandscape data={data.activity} />;
}
async function AIInsightsSection({
  dataPromise,
}: {
  dataPromise: ReturnType<typeof getFullDashboardData>;
}) {
  const data = await dataPromise;

  return <AIInsights insights={data.insights} />;
}
export default async function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // Fetch real GitHub data
  const dataPromise = getFullDashboardData(username);

  let data;
  try {
    data = await dataPromise;
  } catch (error) {
    if (error instanceof Error) {
      return notFound();
    }
    throw error;
  }
  return (
    <div id="dashboard-root" data-dashboard className="p-4 md:p-6 lg:p-8 min-h-screen relative">
      <div id="generate-dashboard-btn" className="flex justify-end mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.15)] bg-black px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
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
          Generate Your Own Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar */}
        <aside className="flex flex-col gap-6">
          <ProfileCard
            user={data.profile}
            exportData={{ stats: data.stats, languages: data.languages }}
          />
          {/* We omit real achievements data generation for now and just show a placeholder based on streaks */}
          <Achievements
            achievements={[
              {
                id: '1',
                title: 'Streak Master',
                description: 'Reached a 7 day streak',
                icon: 'Flame',
                isUnlocked: data.stats.currentStreak >= 7,
              },
              {
                id: '2',
                title: 'Consistent',
                description: 'Over 100 contributions',
                icon: 'GitCommit',
                isUnlocked: data.stats.totalContributions >= 100,
              },
              {
                id: '3',
                title: 'Polyglot',
                description: 'Uses multiple languages',
                icon: 'Code',
                isUnlocked: data.languages.length >= 2,
              },
              {
                id: '4',
                title: 'Night Owl',
                description: 'Commits late at night',
                icon: 'Moon',
                isUnlocked: true,
              },
            ]}
          />
        </aside>

        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <section>
            <Suspense
              fallback={
                <div className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
              }
            >
              <ActivityLandscapeSection dataPromise={dataPromise} />
            </Suspense>
            {/*Activity section loads separately without blocking the dashboard shell */}
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
              description="Last Year"
              icon="GitCommit"
            />
          </div>

          <Suspense
            fallback={
              <div className="h-48 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            }
          >
            <AIInsightsSection dataPromise={dataPromise} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
