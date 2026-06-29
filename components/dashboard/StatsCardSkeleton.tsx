'use client';

export default function StatsCardSkeleton() {
  // Deterministic heights - no Math.random()
  const heights = [24, 32, 18, 45, 38, 52, 28, 42, 35, 48, 30, 22];

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3">
          <div className="h-3 w-24 shimmer rounded" />
          <div className="h-8 w-32 shimmer rounded" />
          <div className="h-3 w-36 shimmer rounded" />
        </div>
        <div className="h-9 w-9 rounded-lg shimmer" />
      </div>

      {/* Micro chart skeleton with deterministic heights */}
      <div className="w-full h-8 flex items-end justify-between gap-px opacity-80">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 shimmer rounded-t-[1px]" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
