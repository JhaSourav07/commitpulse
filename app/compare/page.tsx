import { Suspense } from 'react';
import type { Metadata } from 'next';
import CompareClient from './CompareClient';
import { Footer } from '../components/Footer';

// Use dynamic metadata to show the compared usernames in the link preview
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;

  // Extract user parameters (adjust 'user1' and 'user2' if your URL uses different parameter names)
  const user1 = typeof resolvedSearchParams?.user1 === 'string' ? resolvedSearchParams.user1 : null;
  const user2 = typeof resolvedSearchParams?.user2 === 'string' ? resolvedSearchParams.user2 : null;

  const title =
    user1 && user2
      ? `Compare: ${user1} vs ${user2} | CommitPulse`
      : 'Compare Developers | CommitPulse';

  const description =
    user1 && user2
      ? `Put ${user1} and ${user2} head-to-head. Compare their GitHub streaks, contributions, and 3D monoliths.`
      : 'Compare two GitHub developers side-by-side — streaks, contributions, languages, and 3D monoliths.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function ComparePage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center pt-28 pb-16">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
        }
      >
        <CompareClient />
      </Suspense>
      <div className="mx-auto max-w-7xl px-6 pb-8">
        <Footer />
      </div>
    </>
  );
}
