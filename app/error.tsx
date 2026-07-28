'use client';
import { copyToClipboard } from '@/utils/clipboard';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  const errorMessage = error?.message || '';

  const terminalContent = `git status
  
  fatal: Your branch and 'origin/main' have diverged,
  and have 1 and 1 different commits each, respectively.
  
  Error details:
  ${errorMessage || 'Unknown exception in the render tree.'}`;

  const handleCopy = async () => {
    try {
      await copyToClipboard(terminalContent);
      toast.success('Terminal output copied!');
    } catch {
      toast.error('Failed to copy terminal output');
    }
  };

  return (
    <main className="relative min-h-screen text-white overflow-hidden flex flex-col items-center justify-center font-sans py-20 px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] h-screen w-screen rounded-full blur-[140px] bg-red-500/10" />
        <div className="absolute bottom-[-10%] right-[15%] h-screen w-screen rounded-full blur-[120px] bg-red-500/10" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start gap-8 max-w-lg w-full text-center">
        <div className="relative select-none w-full">
          <span className="text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter relative bg-[linear-gradient(135deg,_#f87171_0%,_#ef4444_50%,_#b91c1c_100%)] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            𝒆𝒓𝒓𝒐𝒓
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-sm font-bold tracking-tight">
            Looks like an exception was{' '}
            <span className="bg-linear-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              thrown
            </span>{' '}
            in the application.
          </h1>
        </div>

        <div
          onClick={handleCopy}
          className="w-full rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md overflow-hidden cursor-pointer hover:bg-white/5 transition-all duration-200"
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/4 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs font-mono text-white/30">commitpulse — error</span>
            <span className="ml-auto text-xs text-white/40">Click to copy</span>
          </div>

          <div className="px-6 py-5 font-mono text-sm text-left space-y-2">
            <p>
              <span className="text-red-400">~</span>
              <span className="text-white/40"> $ </span>
              <span className="text-white/80">git status</span>
            </p>

            <p className="text-red-400/80">
              fatal: Your branch and &apos;origin/main&apos; have diverged.
              <br />
              <span className="text-white/60 text-xs mt-2 block">
                {errorMessage || 'Unknown runtime error occurred.'}
              </span>
            </p>

            <p className="flex items-center gap-1 pt-1">
              <span className="text-red-400">~</span>
              <span className="text-white/40"> $ </span>
              <span className="w-2 h-4 bg-red-400 animate-pulse inline-block ml-1 rounded-sm" />
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              boxShadow: '0 0 30px rgba(239,68,68,0.3)',
            }}
          >
            git fetch &amp;&amp; git reset --hard
          </button>

          <Link
            href="/"
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/60 text-center border border-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            Return to main
          </Link>
        </div>
      </div>
    </main>
  );
}
