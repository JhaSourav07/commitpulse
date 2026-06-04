import { Suspense } from "react";
import { PopularRepos } from "./PopularPinnnedRepos";

function PopularReposSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto animate-pulse">
      <div className="p-5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 shimmer rounded" />
            <div className="h-4 w-24 shimmer rounded" />
          </div>
          <div className="h-6 w-20 shimmer rounded" />
        </div>
        <div className="flex flex-col gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-full h-[100px] flex items-start gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-neutral-800/60 bg-gray-50/50 dark:bg-neutral-900/30"
            >
              <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="h-4 w-32 shimmer rounded" />
                  <div className="h-3 w-full shimmer rounded" />
                  <div className="h-3 w-4/5 shimmer rounded" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-3 w-16 shimmer rounded" />
                  <div className="h-3 w-12 shimmer rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SuspendedPopularRepos({ popularRepos, pinnedRepos }: { popularRepos?: Record<string, unknown>[]; pinnedRepos?: Record<string, unknown>[] }) {
  return (
    <Suspense fallback={<PopularReposSkeleton />}>
      <PopularRepos popularRepos={popularRepos} pinnedRepos={pinnedRepos} />
    </Suspense>
  );
}
