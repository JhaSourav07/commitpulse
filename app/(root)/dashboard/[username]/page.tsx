import type { Metadata } from 'next';
import ProfileCard from '@/components/dashboard/ProfileCard';
import StatsCard from '@/components/dashboard/StatsCard';
import AIInsights from '@/components/dashboard/AIInsights';
import Achievements from '@/components/dashboard/Achievements';
import Link from 'next/link';
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
  const description = `Mock dashboard for testing`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/dashboard/${username}`,
      siteName: 'CommitPulse',
      type: 'profile',
    },
  };
}

export default async function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const data = {
  profile: {
  username,
  login: username,
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
  bio: 'Mock developer profile for testing',
  html_url: `https://github.com/${username}`,
  name: username,

  isPro: false,
  location: 'Earth 🌍',
  joinedDate: '2024-01-01',
  developerScore: 87,

  stats: {
    repositories: 32,
    stars: 128,
    followers: 120,
    following: 45,
  },
},

    stats: {
      currentStreak: 14,
      peakStreak: 62,
      totalContributions: 1847,
    },

    languages: [
      {
        name: 'TypeScript',
        percentage: 45,
        color: '#3178C6',
      },
      {
        name: 'JavaScript',
        percentage: 25,
        color: '#F7DF1E',
      },
    ],
insights: [
  {
    id: '1',
    text: 'Most active during late evenings.',
    icon: 'Moon',
  },
  {
    id: '2',
    text: 'Consistent contribution streak this month.',
    icon: 'Flame',
  },
  {
    id: '3',
    text: 'Strong focus on frontend technologies.',
    icon: 'Code',
  },
],
  };

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
        {/* Left Sidebar */}
        <aside className="flex flex-col gap-6">
          <ProfileCard
            user={data.profile}
            exportData={{
              stats: data.stats,
              languages: data.languages,
            }}
          />

          <Achievements
            achievements={[
              {
                id: '1',
                title: 'Streak Master',
                description: 'Reached a 7 day streak',
                icon: 'Flame',
                isUnlocked: true,
              },
            ]}
          />
        </aside>

        {/* Main */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <div className="rounded-2xl border border-white/10 p-8 text-white">
            Mock Dashboard Loaded Successfully 🚀
          </div>
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
        </aside>
      </div>
    </div>
  );
}