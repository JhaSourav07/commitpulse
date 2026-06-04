import { Suspense } from "react";
import CommitClock from "./CommitClock";
import type { CommitClockData } from "@/types/dashboard";

function CommitClockSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col items-center min-h-[300px]">
      <div className="w-full mb-1">
        <div className="h-4 w-20 shimmer rounded mb-1" />
        <div className="h-3 w-24 shimmer rounded opacity-70" />
      </div>
      <div className="relative w-[280px] h-[280px] flex items-center justify-center mt-4">
        <div className="w-[280px] h-[280px] rounded-full shimmer" />
      </div>
    </div>
  );
}

export default function SuspendedCommitClock({ data }: { data: CommitClockData[] }) {
  return (
    <Suspense fallback={<CommitClockSkeleton />}>
      <CommitClock data={data} />
    </Suspense>
  );
}
