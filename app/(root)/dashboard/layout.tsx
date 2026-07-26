import { ReactNode } from 'react';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white selection:bg-cyan-500/30 font-sans">
      <main className="max-w-[1600px] mx-auto min-h-screen">{children}</main>

      <Toaster />
    </div>
  );
}
