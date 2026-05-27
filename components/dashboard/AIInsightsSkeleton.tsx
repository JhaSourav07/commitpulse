export default function AIInsightsSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] relative">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-4 h-4 shimmer rounded-full" />
        <div className="w-24 h-4 shimmer rounded" />
      </div>

      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-[rgba(255,255,255,0.05)]"
          >
            <div className="w-4 h-4 shimmer rounded-full mt-0.5 shrink-0" />

            <div className="flex-1 space-y-2">
              <div className="h-3 shimmer rounded w-full" />
              <div className="h-3 shimmer rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
