'use client';
import Link from 'next/link';
import { toast } from 'sonner';
import MiniGame from '../components/MiniGame';

export default function NotFound() {
  const terminalContent = `git checkout this-page\n\nThe page you're looking for has been rebased out of existence. No stash. No reflog. Just vibes.\n\nhint: Did you mean some other username?`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(terminalContent);
      toast.success('Terminal output copied!');
    } catch {
      toast.error('Failed to copy terminal output');
    }
  };

  return (
    <main className="relative min-h-screen text-white overflow-x-hidden flex flex-col items-center font-sans py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] h-screen w-screen rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] h-screen w-screen rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start gap-6 max-w-lg w-full text-center px-4">
        {/* ✅ UPDATED OOPS HEADER WITH SMOOTH 404 ANIMATION */}
        <div className="relative select-none w-full mt-4">
          {/* glow layer */}
          <span className="absolute inset-0 flex items-center justify-center text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter text-violet-400/10 blur-xl animate-pulse">
            404
          </span>

          {/* stroke layer */}
          <span className="absolute inset-0 flex items-center justify-center text-[7rem] sm:text-[9rem] font-sans leading-none tracking-tighter text-white/5 [WebkitTextStroke:1px_rgba(139,92,246,0.3)] animate-pulse">
            404
          </span>

          {/* main gradient layer */}
          <span className="relative flex items-center justify-center text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter bg-[linear-gradient(135deg,_#a78bfa_0%,_#38bdf8_50%,_#a78bfa_100%)] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-[pulse_2s_ease-in-out_infinite]">
            404
          </span>
        </div>

        {/* Subtitle */}
        <div className="space-y-2 mt-2">
          <h1 className="text-sm font-bold tracking-tight">
            Looks like this commit got{' '}
            <span className="bg-linear-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              force-pushed
            </span>{' '}
            to /dev/null
          </h1>
        </div>

        {/* 🎮 THE NEW ADDICTIVE MINI GAME */}
        <div className="w-full">
          <MiniGame />
        </div>

        {/* Terminal Block */}
        <div
          onClick={handleCopy}
          className="w-full rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md overflow-hidden cursor-pointer hover:bg-white/5 transition-all duration-200 shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/4 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs font-mono text-white/30">commitpulse — bash</span>
            <span className="ml-auto text-xs text-white/40">Click to copy</span>
          </div>

          <div className="px-6 py-5 font-mono text-sm text-left space-y-2">
            <p>
              <span className="text-violet-400">~</span>
              <span className="text-white/40"> $ </span>
              <span className="text-white/80">
                git checkout <span className="text-cyan-400">this-page</span>
              </span>
            </p>

            <p className="text-red-400/80">
              The page you&apos;re looking for has been rebased out of existence. No stash. No
              reflog. Just vibes.
            </p>

            <p className="text-white/30 text-xs mt-1">hint: Did you mean some other username?</p>

            <p className="flex items-center gap-1 pt-1">
              <span className="text-violet-400">~</span>
              <span className="text-white/40"> $ </span>
              <span className="w-2 h-4 bg-violet-400 animate-pulse inline-block ml-1 rounded-sm" />
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pb-8">
          <Link
            href="https://github.com/JhaSourav07/commitpulse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
              boxShadow: '0 0 30px rgba(124,58,237,0.3)',
            }}
          >
            git checkout main
          </Link>

          <Link
            href="/"
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/60 text-center border border-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
}
