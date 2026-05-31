'use client';

import { useEffect, useState } from 'react';

interface Company {
  _id: string;
  companyName: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/companies/pending')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setCompanies(data.companies);
      })
      .catch(() => {
        if (!cancelled) setMessage('Failed to load pending companies');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function refresh() {
    setLoading(true);
    fetch('/api/admin/companies/pending')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCompanies(data.companies);
      })
      .catch(() => setMessage('Failed to load pending companies'))
      .finally(() => setLoading(false));
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/companies/${id}/${action}`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setCompanies((prev) => prev.filter((c) => c._id !== id));
        setMessage(data.message || `Company ${action}d successfully`);
      } else {
        setMessage(data.error || `Failed to ${action}`);
      }
    } catch {
      setMessage(`Something went wrong trying to ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-gray-200 bg-white/70 dark:border-white/25 dark:bg-black/45 backdrop-blur-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin &mdash; Pending Companies
            </h1>
            <button
              onClick={refresh}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-white/15 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 transition"
            >
              Refresh
            </button>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
              {message}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No pending companies to review.
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className="rounded-xl border border-gray-200 dark:border-white/10 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {company.companyName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{company.email}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Registered: {new Date(company.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(company._id, 'approve')}
                        disabled={actionLoading === company._id}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {actionLoading === company._id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(company._id, 'reject')}
                        disabled={actionLoading === company._id}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        {actionLoading === company._id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
