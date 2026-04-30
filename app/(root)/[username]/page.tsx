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
      url: `${BASE_URL}/${username}`,
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

export default async function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  // Fetch real GitHub data
  const data = await getFullDashboardData(username);

  return (
    <div id="dashboard-root" data-dashboard className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar */}
        <aside className="flex flex-col gap-6">
          <ProfileCard user={data.profile} />
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
      </div>
    </div>
  );
}
