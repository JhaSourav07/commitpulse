import type { Metadata } from 'next';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { getFullDashboardData, fetchUserProfile, fetchUserRepos } from '@/lib/github';
import { getUserGitHubToken } from '@/lib/githubtoken';

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
  const userToken = await getUserGitHubToken();

  let data;

  try {
    data = await getFullDashboardData(username, {
      bypassCache,
      from: period.from,
      to: period.to,
      rangeLabel: period.label,
      token: userToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      let fallbackProfile;
      try {
        fallbackProfile = await fetchUserProfile(username, {
          bypassCache,
          token: userToken,
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
    const reposData = await fetchUserRepos(username, { bypassCache, token: userToken });
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
        token: userToken,
      });
    } catch {
      compareData = null;
    }
  }

  return (
    <DashboardPageWrapper>
      <DashboardClient
        initialData={data}
        allRepoActivity={allRepos}
        username={username}
        compareData={compareData}
        period={period}
      />
    </DashboardPageWrapper>
  );
}
