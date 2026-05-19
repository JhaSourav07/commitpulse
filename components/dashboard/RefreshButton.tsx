'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type RefreshButtonProps = {
  username: string;
};

export default function RefreshButton({ username }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const refreshed = sessionStorage.getItem('dashboard-refreshed');

    if (refreshed === 'true') {
      toast.success('Dashboard refreshed successfully');

      sessionStorage.removeItem('dashboard-refreshed');
    }
  }, []);

  const handleRefresh = async () => {
    setLoading(true);

    sessionStorage.setItem('dashboard-refreshed', 'true');

    window.location.href = `/dashboard/${username}?refresh=true`;
  };

  return (
    <button
      onClick={handleRefresh}
      className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.15)] bg-black px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
    >
      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />

      {loading ? 'Refreshing...' : 'Refresh Data'}
    </button>
  );
}
