// app/(root)/dashboard/[username]/page.tsx

import type { Metadata } from 'next';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { getFullDashboardData, fetchUserProfile } from '@/lib/github';
import { notFound, redirect } from 'next/navigation';

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
      let fallbackProfile;
      try {
        fallbackProfile = await fetchUserProfile(username, { bypassCache });
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

  return <DashboardClient initialData={data} username={username} />;
}
