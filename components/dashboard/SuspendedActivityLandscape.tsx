import { Suspense } from "react";
import ActivityLandscape from "./ActivityLandscape";
import type { ActivityData } from "@/types/dashboard";

function ActivityLandscapeSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a] animate-pulse">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="h-4 w-32 shimmer rounded" />
          <div className="h-3 w-48 shimmer rounded opacity-70" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-black/5 bg-gray-100 p-0.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111]">
            <div className="px-3 py-1.5 h-6 w-12 shimmer rounded-md" />
          </div>
        </div>
      </div>
      <div className="relative flex h-[200px] w-full items-end justify-between gap-0.5">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="flex-1 shimmer rounded-t-[2px]"
            style={{ height: `${20 + (i % 5) * 15}%` }}
          />
        ))}
      </div>
      <div className="mt-3 h-px w-full bg-black/10 dark:bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}

export default function SuspendedActivityLandscape({ data }: { data: ActivityData[] }) {
  return (
    <Suspense fallback={<ActivityLandscapeSkeleton />}>
      <ActivityLandscape data={data} />
    </Suspense>
  );
}
