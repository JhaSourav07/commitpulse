'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Company {
  companyName: string;
  email: string;
  status: string;
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('company_token');
    if (!token) {
      router.push('/company/signin');
      return;
    }

    fetch('/api/company/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setCompany(data.company);
      })
      .catch(() => {
        localStorage.removeItem('company_token');
        router.push('/company/signin');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleSignOut() {
    localStorage.removeItem('company_token');
    router.push('/company/signin');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!company) return null;

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 dark:text-yellow-400',
    approved: 'text-green-600 dark:text-green-400',
    rejected: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white/70 dark:border-white/25 dark:bg-black/45 backdrop-blur-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-white/15 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 transition"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Company Name</label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {company.companyName}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{company.email}</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Account Status</label>
              <p className={`text-lg font-medium capitalize ${statusColors[company.status] || ''}`}>
                {company.status}
              </p>
            </div>

            {company.status === 'pending' && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
                Your registration is pending admin approval. You will be able to post jobs once
                approved.
              </div>
            )}

            {company.status === 'approved' && (
              <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                Your account is approved. You can now post jobs.
              </div>
            )}

            {company.status === 'rejected' && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                Your registration was not approved. Contact support for more information.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
