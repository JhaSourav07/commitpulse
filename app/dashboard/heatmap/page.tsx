import React, { useEffect, useState } from 'react';
import ActivityHeatmap from '@/components/ActivityHeatmap';

/**
 * Heatmap dashboard page
 * URL: /dashboard/heatmap?user=<github-username>&start=YYYY-MM-DD&end=YYYY-MM-DD
 */
export default function HeatmapPage() {
  const [activity, setActivity] = useState<Array<{ date: string; count: number }>>([]);
  const [totalPRs, setTotalPRs] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Parse query params from the browser URL
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const user = searchParams?.get('user') ?? 'souravjha'; // fallback user
  const start = searchParams?.get('start') ?? undefined;
  const end = searchParams?.get('end') ?? undefined;

  useEffect(() => {
    async function load() {
      try {
        const url = new URL('/api/activity/heatmap', window.location.origin);
        url.searchParams.set('user', user);
        if (start) url.searchParams.set('start', start);
        if (end) url.searchParams.set('end', end);
        const res = await fetch(url.toString());
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to load data');
          return;
        }
        const data = await res.json();
        setActivity(data.activity || []);
        setTotalPRs(data.totalPRs || 0);
        setTotalIssues(data.totalIssues || 0);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    load();
  }, [user, start, end]);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Contributor Activity Heatmap</h1>
      <p className="mb-2">
        User: <strong>{user}</strong>
        {start && end && (
          <>
            {' '}
            | Period: <strong>{start}</strong> → <strong>{end}</strong>
          </>
        )}
      </p>
      <p className="mb-4">
        Total PRs: <strong>{totalPRs}</strong> | Total Issues: <strong>{totalIssues}</strong>
      </p>
      <ActivityHeatmap activity={activity} />
    </div>
  );
}
