'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, Building2, Briefcase, MapPin, Calendar, XCircle } from 'lucide-react';
import type { ApplicationData } from '@/types/applications';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  applied: {
    label: 'Applied',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  selected: {
    label: 'Selected',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.applied;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export default function StudentMyApplicationsPage() {
  const searchParams = useSearchParams();
  const initialUser = searchParams.get('username') || '';
  const [username, setUsername] = useState(initialUser);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchApplications = useCallback(async (user: string) => {
    if (!user.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/student/applications?username=${encodeURIComponent(user.trim())}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch applications');
      }
      const data = await res.json();
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUser && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchApplications(initialUser);
    }
  }, [initialUser, fetchApplications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      window.history.replaceState(null, '', `?username=${encodeURIComponent(username.trim())}`);
      fetchApplications(username);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId);
    try {
      const res = await fetch(`/api/student/applications/${applicationId}/withdraw`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to withdraw application');
      }
      const data = await res.json();
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? data.application : app))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-transparent text-black dark:bg-transparent dark:text-white transition-colors">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[90px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            My{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Applications
            </span>
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Track your placement applications, interview schedules, and status updates.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto mb-10 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              className="w-full rounded-2xl border border-black/10 bg-white/60 py-3 pl-12 pr-4 text-sm backdrop-blur-xl placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-500"
            />
          </div>
        </form>

        {error && (
          <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-red-200 bg-red-50/80 px-6 py-4 text-sm text-red-700 backdrop-blur-xl dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        )}

        {!loading && !error && applications.length === 0 && username && (
          <div className="rounded-3xl border border-black/10 bg-white/40 py-20 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
            <Briefcase className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">No applications found.</p>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="group rounded-3xl border border-black/10 bg-white/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                          {app.jobId?.role || 'Unknown Role'}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {app.jobId?.company || 'Unknown Company'}
                          </span>
                          {app.jobId?.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.jobId.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    {app.jobId?.description && (
                      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {app.jobId.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      {app.interviewDate && (
                        <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Calendar className="h-3.5 w-3.5" />
                          Interview:{' '}
                          {new Date(app.interviewDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    {app.companyFeedback && (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-800/30 dark:bg-yellow-950/20 dark:text-yellow-300">
                        {app.companyFeedback}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {app.status === 'applied' && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawingId === app._id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {withdrawingId === app._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
