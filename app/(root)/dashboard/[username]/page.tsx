import type { Metadata } from 'next';
import ProfileCard from '@/components/dashboard/ProfileCard';
import StatsCard from '@/components/dashboard/StatsCard';
import AIInsights from '@/components/dashboard/AIInsights';
import Achievements from '@/components/dashboard/Achievements';
import Link from 'next/link';
import Heatmap from '@/components/dashboard/Heatmap';
import { notFound } from 'next/navigation';
import ActivityLandscape from '@/components/dashboard/ActivityLandscape';
import LanguageChart from '@/components/dashboard/LanguageChart';
import CommitClock from '@/components/dashboard/CommitClock';
import { getFullDashboardData } from '@/lib/github';
export const revalidate = 3600;

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  const title = `${username}'s Commit Pulse`;
  const description = `${username}'s GitHub contribution pulse`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/dashboard/${username}`,
      siteName: 'CommitPulse',
      type: 'profile',
      images: [
        {
          url: `${BASE_URL}/api/og?username=${username}`,
        },
      ],
    },
  };
}

export default async function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  let data;

  try {
    data = await getFullDashboardData(username, {
      bypassCache: false,
    });
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
          Generate Your Own Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
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

        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <ActivityLandscape data={data.activity} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LanguageChart languages={data.languages} />
            <CommitClock data={data.commitClock} />
          </div>

          <Heatmap data={data.activity} />
        </div>

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

          <AIInsights insights={data.insights} />
        </aside>
      </div>
    </div>
  );
}
