import { Suspense } from "react";
import RepositoryGraph from "./RepositoryGraph";
import type { GraphNode, GraphLink } from "@/types";

function RepositoryGraphSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="h-6 w-48 shimmer rounded mb-2" />
          <div className="h-4 w-64 shimmer rounded" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-20 shimmer rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-grow bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden" style={{ height: 400 }}>
          <div className="w-full h-full shimmer" />
        </div>
        <div className="lg:w-80 flex flex-col gap-6 hidden lg:flex">
          <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] rounded-xl p-6">
            <div className="h-5 w-32 shimmer rounded mb-6" />
            <div className="space-y-5">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-24 shimmer rounded mb-1" />
                  <div className="h-4 w-40 shimmer rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuspendedRepositoryGraph({ data }: { data: { nodes: GraphNode[]; links: GraphLink[] } }) {
  return (
    <Suspense fallback={<RepositoryGraphSkeleton />}>
      <RepositoryGraph data={data} />
    </Suspense>
  );
}
