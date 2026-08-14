'use client';

interface DashboardPageWrapperProps {
  children: React.ReactNode;
}

/**
 * Wraps dashboard page content.
 * Now renders instantly to support React Suspense streaming.
 */
export default function DashboardPageWrapper({ children }: DashboardPageWrapperProps) {
  return <>{children}</>;
}
