'use client';

import { ExternalLink, GitBranch, Rocket } from 'lucide-react';
import type { DeploymentData, WorkflowStatus } from '@/types/dashboard';

interface DeploymentTrackerProps {
  data?: DeploymentData[];
}

/* ── Relative time formatting (e.g. "4 hours ago") ───────────────────────── */
function timeAgo(iso: string | null): string {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  const units: [string, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [label, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) {
      return `${value} ${label}${value > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

/* ── Status badge config ─────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; dot: string; text: string; bg: string; ring: string; pulse?: boolean }
> = {
  success: {
    label: 'Success',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    ring: 'ring-emerald-600/20 dark:ring-emerald-400/20',
  },
  failure: {
    label: 'Failed',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-500/10',
    ring: 'ring-red-600/20 dark:ring-red-400/20',
  },
  in_progress: {
    label: 'In Progress',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    ring: 'ring-amber-600/20 dark:ring-amber-400/20',
    pulse: true,
  },
  unknown: {
    label: 'Unknown',
    dot: 'bg-gray-400',
    text: 'text-gray-600 dark:text-zinc-400',
    bg: 'bg-gray-50 dark:bg-zinc-800/50',
    ring: 'ring-gray-500/20 dark:ring-zinc-500/20',
  },
};

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {cfg.pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60 animate-ping`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      </span>
      {cfg.label}
    </span>
  );
}

export default function DeploymentTracker({ data = [] }: DeploymentTrackerProps) {
  if (!data || data.length === 0) return null;

  const deployments = data.slice(0, 3);

  return (
    <div className="w-full p-5 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0a0a0a] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Rocket size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Production Deployments</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {deployments.map((d) => (
          <div
            key={d.repoName}
            className="group relative flex flex-col gap-2.5 p-3 rounded-xl border border-gray-200/60 dark:border-neutral-800/60 bg-gray-50/50 hover:bg-gray-100/80 dark:bg-neutral-900/30 dark:hover:bg-neutral-800/40 transition-all duration-200"
          >
            {/* Header: repo name + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <GitBranch size={12} className="text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                <a
                  href={d.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-foreground truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title={d.repoName}
                >
                  {d.repoName}
                </a>
              </div>
              <StatusBadge status={d.status} />
            </div>

            {/* Live URL link */}
            {d.liveUrl ? (
              <a
                href={d.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate group/link min-w-0"
              >
                <ExternalLink
                  size={11}
                  className="flex-shrink-0 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                />
                <span className="truncate">{d.liveUrl.replace(/^https?:\/\//, '')}</span>
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-zinc-600 italic">
                No live URL configured
              </span>
            )}

            {/* Footer: environment + relative timestamp */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                {d.environment}
              </span>
              <span>Deployed {timeAgo(d.deployedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
