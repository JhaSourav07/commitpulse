import type { Metadata } from 'next';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { getFullDashboardData, fetchUserProfile, fetchUserRepos } from '@/lib/github';
import type { RepoActivityInfo } from '@/types/dashboard';
import { notFound, redirect } from 'next/navigation';
import { resolveDashboardPeriod } from '@/utils/dashboardPeriod';
import DashboardPageWrapper from '../DashboardPageWrapper';

export const revalidate = 3600; // Cache for 1 hour

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://commitpulse.vercel.app');

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;

  const queryParams = new URLSearchParams({ user: username });
  if (typeof resolvedSearchParams?.theme === 'string')
    queryParams.set('theme', resolvedSearchParams.theme);
  if (typeof resolvedSearchParams?.bg === 'string') queryParams.set('bg', resolvedSearchParams.bg);
  if (typeof resolvedSearchParams?.text === 'string')
    queryParams.set('text', resolvedSearchParams.text);
  if (typeof resolvedSearchParams?.accent === 'string')
    queryParams.set('accent', resolvedSearchParams.accent);

  const ogImage = `${BASE_URL}/api/og?${queryParams.toString()}`;

  // Dynamic title based on whether a user is comparing stats
  const compareUsername = resolvedSearchParams?.compare;
  const title =
    typeof compareUsername === 'string' && compareUsername
      ? `Compare: ${username} vs ${compareUsername} | CommitPulse`
      : `${username}'s Commit Pulse`;

  const description =
    typeof compareUsername === 'string' && compareUsername
      ? `Comparing ${username} and ${compareUsername}'s GitHub contribution pulse on CommitPulse.`
      : `Check out ${username}'s GitHub contribution pulse — streaks, insights, and more on CommitPulse.`;

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
  searchParams: Promise<{
    refresh?: string;
    compare?: string;
    year?: string;
    month?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const bypassCache = resolvedSearchParams?.refresh === 'true';
  const compareUsername = resolvedSearchParams?.compare;
  const period = resolveDashboardPeriod({
    year: resolvedSearchParams?.year,
    month: resolvedSearchParams?.month,
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  });

  let data;

  try {
    data = await getFullDashboardData(username, {
      bypassCache,
      from: period.from,
      to: period.to,
      rangeLabel: period.label,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      let fallbackProfile;
      try {
        fallbackProfile = await fetchUserProfile(username, {
          bypassCache,
        });
      } catch {
        return notFound();
      }
      if (fallbackProfile.type === 'Organization') {
        redirect(`/dashboard/org/${username}`);
      }
      return notFound();
    }
    throw error;
  }

  let allRepos: RepoActivityInfo[] = [];
  try {
    const reposData = await fetchUserRepos(username, { bypassCache });
    allRepos = reposData.map((r) => ({
      name: r.name,
      url: `https://github.com/${username}/${r.name}`,
      pushedAt: r.pushed_at ?? r.updated_at ?? null,
    }));
  } catch {
    allRepos = [];
  }

  let compareData = null;

  if (compareUsername && compareUsername.toLowerCase() !== username.toLowerCase()) {
    try {
      compareData = await getFullDashboardData(compareUsername, {
        bypassCache,
      });
    } catch {
      compareData = null;
    }
  }

  // 1. Safely calculate the profile object with correct schema property naming
  const fallbackProfile = {
    username: username,
    name: data?.profile?.name || username,
    avatar_url: (data?.profile as any)?.avatar_url || (data?.profile as any)?.avatarUrl || '', // 🟢 Uses correct snake_case fallback name
    bio: data?.profile && 'bio' in data.profile ? (data.profile as any).bio || '' : '',
    location:
      data?.profile && 'location' in data.profile ? (data.profile as any).location || '' : '',
    joinedDate:
      data?.profile && 'joinedDate' in data.profile ? (data.profile as any).joinedDate || '' : '',
    developerScore:
      data?.profile && 'developerScore' in data.profile
        ? (data.profile as any).developerScore || 0
        : 0,
  };

  // 2. Safely calculate stats keys with all old vs new naming combinations
  const safeStats = {
    currentStreak:
      (data as any)?.stats?.currentStreak ?? (data as any)?.streakStats?.currentStreak ?? 0,
    peakStreak:
      (data as any)?.stats?.peakStreak ??
      (data as any)?.streakStats?.peakStreak ??
      (data as any)?.streakStats?.longestStreak ??
      0,
    totalContributions:
      (data as any)?.stats?.totalContributions ??
      (data as any)?.streakStats?.totalContributions ??
      (data as any)?.streakStats?.totalCommits ??
      0,
  };

  return (
    <DashboardPageWrapper>
      <DashboardClient
        initialData={{
          profile: fallbackProfile as any,
          languages: data?.languages ?? [],
          graphData: (data?.graphData as any) ?? { nodes: [], links: [] },
          activity: data?.activity ?? [],
          insights: data?.insights ?? [],
          achievements: data?.achievements ?? [],
          commitClock: data?.commitClock ?? (data as any)?.commitclock ?? [],
          stats: safeStats,
        }}
        username={username}
        period={(data as any)?.period ?? '30d'}
      />
    </DashboardPageWrapper>
  );
}
