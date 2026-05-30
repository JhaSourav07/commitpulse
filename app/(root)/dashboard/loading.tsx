import StatsCardSkeleton from '@/components/dashboard/StatsCardSkeleton';
import AchievementsSkeleton from '@/components/dashboard/AchievementsSkeleton';
import AIInsightsSkeleton from '@/components/dashboard/AIInsightsSkeleton';

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-black text-white">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar Skeleton */}
        <div className="flex flex-col gap-6">
          {/* Profile Card Skeleton Placeholder */}
          <div className="h-100 rounded-2xl shimmer border border-white/10" />

          {/* Achievements Skeleton */}
          <div className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-4 h-4 shimmer rounded" />
              <div className="w-24 h-4 shimmer rounded" />
            </div>
            <AchievementsSkeleton />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Hero/Profile section */}
          <div className="h-64 rounded-2xl shimmer border border-white/10" />

          {/* Stats Cards Grid - 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>

          {/* Bottom section */}
          <div className="h-48 rounded-2xl shimmer border border-white/10" />
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="h-24 rounded-2xl shimmer border border-white/10" />
          <div className="h-24 rounded-2xl shimmer border border-white/10" />
          <div className="h-24 rounded-2xl shimmer border border-white/10" />
          <AIInsightsSkeleton />
        </div>
      </div>
    </div>
  );
}
