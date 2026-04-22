export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-6 lg:gap-8">
        {/* Left Sidebar Skeleton */}
        <aside className="flex flex-col gap-6">
          <div className="h-[600px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <section>
            <div className="h-[350px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[300px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            <div className="h-[300px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          </section>

          <section>
            <div className="h-[200px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          </section>
        </div>

        {/* Right Sidebar Skeleton */}
        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="h-[100px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            <div className="h-[100px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
            <div className="h-[100px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          </div>

          <div className="h-[250px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
          <div className="h-[250px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
        </aside>
      </div>
    </div>
  );
}
