import AchievementsSkeleton from './AchievementsSkeleton';
import AIInsightsSkeleton from './AIInsightsSkeleton';
import StatsCardSkeleton from './StatsCardSkeleton';

export default function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
      {/* Left Sidebar */}
      <div className="flex flex-col gap-6">
        {/* Profile card */}
        <div className="h-64 rounded-2xl shimmer border border-white/10" />

        {/* Achievements */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-4 h-4 shimmer rounded" />
            <div className="w-24 h-4 shimmer rounded" />
          </div>
          <AchievementsSkeleton />
        </div>

        {/* ResumeProfileSection */}
        <div className="h-32 rounded-2xl shimmer border border-white/10" />
      </div>

      {/* Center Column */}
      <div className="flex flex-col gap-6 lg:gap-8">
        {/* ActivityLandscape */}
        <div className="h-64 rounded-2xl shimmer border border-white/10" />

        {/* LanguageChart + CommitClock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 rounded-2xl shimmer border border-white/10" />
          <div className="h-48 rounded-2xl shimmer border border-white/10" />
        </div>

        {/* HistoricalTrendView */}
        <div className="h-64 rounded-2xl shimmer border border-white/10" />

        {/* RepositoryGraph */}
        <div className="h-64 rounded-2xl shimmer border border-white/10" />
      </div>

      {/* Right Sidebar */}
      <div className="flex flex-col gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <AIInsightsSkeleton />
        {/* PopularRepos */}
        <div className="h-40 rounded-2xl shimmer border border-white/10" />
      </div>
    </div>
  );
}
