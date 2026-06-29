export default function AIInsightsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading AI Insights"
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-4 h-4 shimmer rounded-full opacity-80" />
        <div className="w-24 h-4 shimmer rounded opacity-80" />
      </div>

      {/* Insight Rows */}
      <div className="flex flex-col gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-300 dark:bg-[#111] border border-[rgba(255,255,255,0.05)]"
          >
            {/* Icon */}
            <div className="w-4 h-4 shimmer rounded-full mt-1 shrink-0 opacity-80" />

            {/* Text */}
            <div className="flex-1 space-y-2">
              <div className="h-3 shimmer rounded w-full opacity-80" />
              <div className="h-3 shimmer rounded w-4/5 opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
