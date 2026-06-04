import { Suspense } from "react";
import HistoricalTrendView from "./HistoricalTrendView";
import type { ActivityData } from "@/types/dashboard";
import type { DashboardPeriod } from "@/utils/dashboardPeriod";

function HistoricalTrendViewSkeleton() {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a] animate-pulse">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="h-4 w-32 shimmer rounded mb-2" />
          <div className="h-4 w-48 shimmer rounded mb-1" />
          <div className="h-3 w-24 shimmer rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 shimmer rounded" />
          <div className="h-8 w-24 shimmer rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-black/10 bg-gray-50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#111]">
            <div className="h-3 w-20 shimmer rounded mb-2" />
            <div className="h-8 w-16 shimmer rounded mb-1" />
            <div className="h-3 w-32 shimmer rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-40 w-full shimmer rounded" />
    </div>
  );
}

export default function SuspendedHistoricalTrendView({ username, activity, period }: { username: string; activity: ActivityData[]; period: DashboardPeriod }) {
  return (
    <Suspense fallback={<HistoricalTrendViewSkeleton />}>
      <HistoricalTrendView username={username} activity={activity} period={period} />
    </Suspense>
  );
}
