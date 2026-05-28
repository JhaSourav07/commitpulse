export default function AIInsightsSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-[#111111] border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-5 shimmer rounded-full" />
        <div className="w-28 h-4 shimmer rounded-md" />
      </div>

      {/* Insight Cards */}
      <div className="flex flex-col gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-xl bg-[#181818] border border-white/5"
          >
            {/* Icon */}
            <div className="w-5 h-5 shimmer rounded-full shrink-0 mt-1" />

            {/* Text */}
            <div className="flex-1 space-y-2">
              <div className="h-3 shimmer rounded-md w-full" />
              <div className="h-3 shimmer rounded-md w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
