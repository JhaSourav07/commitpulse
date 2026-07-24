import React from 'react';

export default async function PullRequestWorkspace({
  params,
}: {
  params: Promise<{ orgname: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="p-8 min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pull Request Intelligence Workspace</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Analytics and lifecycle metrics for {resolvedParams.orgname}
        </p>
      </header>

      {/* Grid container for future charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">PR Lifecycle</h2>
          <p className="text-sm text-zinc-500">Visualization coming soon.</p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Reviewer Workload</h2>
          <p className="text-sm text-zinc-500">Visualization coming soon.</p>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Merge Success</h2>
          <p className="text-sm text-zinc-500">Visualization coming soon.</p>
        </div>
      </div>
    </div>
  );
}
