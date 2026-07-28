import React from 'react';

export default async function SecurityCommandCenter({
  params,
}: {
  params: Promise<{ orgname: string }>;
}) {
  // Next.js 15 requires awaiting params
  const resolvedParams = await params;

  return (
    <div className="p-8 min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Repository Security Command Center</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Security monitoring and compliance posture for {resolvedParams.orgname}
        </p>
      </header>

      {/* Grid container for future security widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Security Risk Overview</h2>
          <p className="text-sm text-zinc-500">Vulnerability metrics coming soon.</p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Secret Scanning</h2>
          <p className="text-sm text-zinc-500">Exposure tracking coming soon.</p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Compliance Scorecard</h2>
          <p className="text-sm text-zinc-500">Audit trails coming soon.</p>
        </div>
      </div>
    </div>
  );
}
