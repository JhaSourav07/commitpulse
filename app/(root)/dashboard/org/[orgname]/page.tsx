// app/(root)/dashboard/org/[orgname]/page.tsx

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import ProfileCard from '@/components/dashboard/ProfileCard';
import ActivityLandscape from '@/components/dashboard/ActivityLandscape';
import StatsCard from '@/components/dashboard/StatsCard';
import CommitClock from '@/components/dashboard/CommitClock';
import Heatmap from '@/components/dashboard/Heatmap';
import AIInsights from '@/components/dashboard/AIInsights';
import Achievements from '@/components/dashboard/Achievements';
import { getOrgDashboardData, buildCommitClock, generateAchievements } from '@/lib/github';

export const revalidate = 3600; // Cache for 1 hour

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgname: string }>;
}): Promise<Metadata> {
  const { orgname } = await params;
  const ogImage = `${BASE_URL}/api/og?user=${orgname}`; // Reuse OG, but it will fetch org data gracefully
  const title = `${orgname} | Organization Mega-City`;
  const description = `Explore the aggregated open-source contribution pulse for the ${orgname} organization on CommitPulse.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/dashboard/org/${orgname}`,
      siteName: 'CommitPulse',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'profile',
    },
  };
}

export default async function OrgDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgname: string }>;
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { orgname } = await params;
  const refreshParams = await searchParams;
  const bypassCache = refreshParams?.refresh === 'true';

  let data;

  try {
    data = await getOrgDashboardData(orgname, { bypassCache });
  } catch (error) {
    console.error(error);
    return notFound();
  }

  // 1. Process Calendar into Activity Array for Org
  const allDays = data.calendar.weeks.flatMap((w) => w.contributionDays);
  const activity = allDays.map((day) => {
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    // Scaled up intensity thresholds because orgs have way more commits than single users
    if (day.contributionCount > 0) intensity = 1;
    if (day.contributionCount > 15) intensity = 2;
    if (day.contributionCount > 50) intensity = 3;
    if (day.contributionCount > 150) intensity = 4;

    return {
      date: day.date,
      count: day.contributionCount,
      intensity,
    };
  });

  // 2. Generate Org Specific Assets
  const commitClock = buildCommitClock(allDays);
  const achievements = generateAchievements(
    data.stats.totalContributions,
    data.stats.currentStreak
  );

  // 3. Custom Org AI Insights
  const insights = [
    {
      id: '1',
      icon: 'Users',
      text: `This organization is powered by ${data.profile.stats.following} core open-source contributors.`,
    },
    {
      id: '2',
      icon: 'GitCommit',
      text: `A massive ${data.stats.totalContributions} total contributions were merged by the team this year.`,
    },
    {
      id: '3',
      icon: 'Flame',
      text: `The team's peak collaborative streak reached ${data.stats.peakStreak} consecutive days.`,
    },
  ];

  return (
    <div id="dashboard-root" data-dashboard className="p-4 md:p-6 lg:p-8 min-h-screen relative">
      {/* Top Action Bar */}
      <div id="generate-dashboard-btn" className="flex justify-between items-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
          Organization Mega-City
        </div>
        <div className="flex gap-4">
          <Link
            href={`/dashboard/org/${orgname}?refresh=true`}
            className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-black dark:bg-black px-4 py-2 text-sm font-semibold text-white dark:text-white transition-all duration-200 hover:bg-gray-800 dark:hover:bg-white/10 active:scale-[0.98]"
          >
            Refresh Data
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-gray-100 dark:bg-[#111] px-4 py-2 text-sm font-semibold text-black dark:text-white transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98]"
          >
            Generate Yours
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar */}
        <aside className="flex flex-col gap-6">
          <ProfileCard
            user={data.profile}
            exportData={{
              stats: data.stats,
              languages: [], // Orgs skip language donut chart for now
            }}
          />
          <Achievements achievements={achievements} />
        </aside>

        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <section>
            <ActivityLandscape data={activity} />
          </section>

          {/* Org specific layout: CommitClock takes full width of the main content column */}
          <section className="grid grid-cols-1 gap-6">
            <CommitClock data={commitClock} />
          </section>

          <section>
            <Heatmap data={activity} />
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <StatsCard
              title="Team Current Streak"
              value={data.stats.currentStreak.toString()}
              description="Days"
              icon="Flame"
            />

            <StatsCard
              title="Team Peak Streak"
              value={data.stats.peakStreak.toString()}
              description="Days"
              icon="TrendingUp"
            />

            <StatsCard
              title="Total Team Commits"
              value={data.stats.totalContributions.toString()}
              description="Last 365 Days"
              icon="GitCommit"
            />
          </div>

          <AIInsights insights={insights} />
        </aside>
      </div>
    </div>
  );
}
