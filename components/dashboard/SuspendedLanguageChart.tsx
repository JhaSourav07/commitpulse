import { Suspense } from "react";
import LanguageChart from "./LanguageChart";
import type { LanguageData } from "@/types/dashboard";

function LanguageChartSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] flex flex-col min-h-[300px]">
      <div className="h-4 w-24 shimmer rounded mb-6" />
      <div className="relative w-36 h-36 rounded-full shimmer mb-8" />
      <div className="w-full flex flex-col gap-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shimmer" />
              <div className="h-3 w-16 shimmer rounded" />
            </div>
            <div className="h-3 w-8 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuspendedLanguageChart({ languages }: { languages: LanguageData[] }) {
  return (
    <Suspense fallback={<LanguageChartSkeleton />}>
      <LanguageChart languages={languages} />
    </Suspense>
  );
}
