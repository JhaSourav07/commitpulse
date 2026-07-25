'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Review {
  _id: string;
  name: string;
  handle: string;
  platform: 'twitter' | 'github';
  message: string;
  accentColor: string;
  approved: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [token, setToken] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const tokenRef = useRef(token);
  const statusFilterRef = useRef(statusFilter);

  useEffect(() => {
    tokenRef.current = token;
    statusFilterRef.current = statusFilter;
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('review_admin_token') : null;
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage on mount
      setToken(saved);
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed || !tokenRef.current) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        const filter = statusFilterRef.current;
        if (filter !== 'all') params.set('status', filter);
        const res = await fetch(`/api/reviews?${params}`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setError(data.message ?? 'Failed to fetch reviews.');
          setIsAuthed(false);
          return;
        }
        setReviews(data.reviews);
        setPagination(data.pagination);
      } catch {
        if (!cancelled) setError('Network error.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, page, statusFilter]);

  function handleLogin() {
    if (token.trim()) {
      localStorage.setItem('review_admin_token', token.trim());
      setToken(token.trim());
      setIsAuthed(true);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'delete') {
    if (!token) return;
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/reviews/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.message ?? 'Failed to delete review.');
          return;
        }
      } else {
        const res = await fetch(`/api/reviews/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approved: action === 'approve' }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.message ?? `Failed to ${action} review.`);
          return;
        }
      }
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setPagination((prev) => (prev ? { ...prev, total: prev.total - 1 } : prev));
    } catch {
      setError('Network error.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('review_admin_token');
    setToken('');
    setIsAuthed(false);
    setReviews([]);
    setPagination(null);
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-[#030712] text-white px-6 py-20">
        <div className="mx-auto max-w-md space-y-8">
          <Link href="/" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">
            &larr; Back to home
          </Link>
          <h1 className="text-3xl font-extrabold">Review Admin</h1>
          <p className="text-white/60">Enter your admin secret to manage reviews.</p>
          <div className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin secret"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleLogin}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold transition-colors hover:bg-emerald-500"
            >
              Sign In
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] text-white px-6 py-20">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link href="/" className="text-sm text-emerald-300 hover:text-emerald-200">
              &larr; Home
            </Link>
            <h1 className="text-3xl font-extrabold">Review Admin</h1>
            <p className="text-white/50 text-sm">
              {pagination?.total ?? 0} total review{(pagination?.total ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5"
          >
            Sign Out
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-white/40 py-12 text-center">Loading...</p>
        ) : reviews.length === 0 ? (
          <p className="text-white/40 py-12 text-center">No reviews found.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: review.accentColor }}
                    >
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{review.name}</p>
                      <p className="text-sm text-white/50">
                        {review.handle} &middot; {review.platform}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 ${
                      review.approved
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {review.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                <p className="text-sm text-white/70 leading-relaxed">{review.message}</p>

                <p className="text-xs text-white/30">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                <div className="flex gap-2 pt-1">
                  {!review.approved && (
                    <button
                      onClick={() => handleAction(review._id, 'approve')}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  )}
                  {review.approved && (
                    <button
                      onClick={() => handleAction(review._id, 'reject')}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-amber-500"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(review._id, 'delete')}
                    className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-semibold transition-colors hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm disabled:opacity-30 hover:bg-white/10"
            >
              Previous
            </button>
            <span className="text-sm text-white/50">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm disabled:opacity-30 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
