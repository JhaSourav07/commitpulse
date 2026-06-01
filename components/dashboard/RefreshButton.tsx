'use client';

import { useEffect, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

type RefreshButtonProps = {
  username: string;
};

export default function RefreshButton({ username }: RefreshButtonProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      toast.success('Dashboard refreshed successfully');

      const params = new URLSearchParams(searchParams.toString());
      params.delete('refresh');
      const query = params.toString();
      router.replace(`/dashboard/${username}${query ? `?${query}` : ''}`);
    }
  }, [searchParams, router, username]);

  const handleRefresh = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('refresh', 'true');
      router.push(`/dashboard/${username}?${params.toString()}`);

      router.refresh();
    });
  };

  return (
    <button
      disabled={isPending}
      onClick={handleRefresh}
      aria-label="Refresh dashboard contribution data"
      title="Refresh dashboard contribution data"
      className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-[rgba(255,255,255,0.15)] bg-black dark:bg-black px-4 py-2 text-sm font-semibold text-white dark:text-white transition-all duration-200 hover:bg-gray-800 dark:hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />

      {isPending ? 'Refreshing...' : 'Refresh Data'}
    </button>
  );
}
