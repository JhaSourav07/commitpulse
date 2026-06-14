import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import GithubWrapped from '@/components/dashboard/GithubWrapped';
import { getFullDashboardData, getWrappedData } from '@/lib/github';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username}'s GitHub Wrapped`,
    description: `A cinematic year-in-review of ${username}'s open-source contributions.`,
  };
}

export default async function WrappedPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const targetYear = resolvedSearchParams?.year || new Date().getFullYear().toString();

  // 1. Fetch data safely.
  // If this fails, the error will bubble up to the nearest error.tsx file.
  let dashboardData;
  let wrappedData;

  try {
    [dashboardData, wrappedData] = await Promise.all([
      getFullDashboardData(username),
      getWrappedData(username, { year: targetYear } as any), // 🟢 Fixes the FetchOptions parameter error on line 37
    ]);
  } catch (error) {
    console.error('[Wrapped] Failed to load wrapped data:', error);
    return notFound();
  }

  // 2. Render the successful component with manual type mappings
  return (
    <GithubWrapped
      profile={
        {
          username: username,
          name: dashboardData?.profile?.name || username,
          avatarUrl:
            (dashboardData?.profile as any)?.avatar_url ||
            (dashboardData?.profile as any)?.avatarUrl ||
            '',
          isPro: false,
          joinedDate: (dashboardData?.profile as any)?.joinedDate || '',
          bio: (dashboardData?.profile as any)?.bio || '',
          location: (dashboardData?.profile as any)?.location || '',
          developerScore: 0,
        } as any
      }
      wrappedData={wrappedData as any}
    />
  );
}
