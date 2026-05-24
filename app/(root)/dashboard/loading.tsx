import StatsCardSkeleton from '@/components/dashboard/StatsCardSkeleton';

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="h-[480px] rounded-2xl shimmer border border-white/10" />
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
        <div className="flex flex-col gap-4">
          <div className="h-24 rounded-2xl shimmer border border-white/10" />
          <div className="h-24 rounded-2xl shimmer border border-white/10" />
          <div className="h-24 rounded-2xl shimmer border border-white/10" />
          <div className="h-48 rounded-2xl shimmer border border-white/10" />
        </div>
      </div>
    </div>
  );
}
