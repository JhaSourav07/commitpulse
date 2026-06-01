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
      getWrappedData(username, targetYear),
    ]);
  } catch (error) {
    console.error('[Wrapped] Failed to load wrapped data:', error);
    // If the user doesn't exist or API fails, trigger the 404 page
    return notFound();
  }

  // 2. Render the successful component outside of any try/catch blocks.
  return (
    <div className="min-h-[85vh] p-4 md:p-8 flex items-center justify-center relative">
      <GithubWrapped profile={dashboardData.profile} wrappedData={wrappedData} />
    </div>
  );
}
