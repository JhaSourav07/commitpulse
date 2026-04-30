import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 font-sans">
      <main className="max-w-[1600px] mx-auto min-h-screen">{children}</main>
    </div>
  );
}
