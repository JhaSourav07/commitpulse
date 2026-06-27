import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';

export default function DashboardUserLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-black text-white">
      <DashboardSkeleton />
    </div>
  );
}
