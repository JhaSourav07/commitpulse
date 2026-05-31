import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative min-h-screen  text-white overflow-hidden flex flex-col items-center font-sans ">
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
        <div className="absolute top-[-10%] left-[20%] h-screen w-screen rounded-full  blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[15%] h-screen w-screen rounded-full  blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start gap-8 max-w-lg w-full text-center">
        <div className="relative select-none w-full">
          <span className="text-[9rem] font-sans leading-none tracking-tighter text-white/5 absolute inset-0 flex items-center justify-center [WebkitTextStroke:1px_rgba(139,92,246,0.3)]">
            𝒐𝒐𝒑𝒔
          </span>
          <span className="text-[9rem] font-black leading-none tracking-tighter relative bg-[linear-gradient(135deg,_#a78bfa_0%,_#38bdf8_50%,_#a78bfa_100%)] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]">
            𝒐𝒐𝒑𝒔
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-sm font-bold tracking-tight">
            Looks like this commit got{' '}
            <span className="bg-linear-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              force-pushed
            </span>{' '}
            to /dev/null
          </h1>
        </div>

        <div className="w-full rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md overflow-hidden ">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/4 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs font-mono text-white/30">commitpulse — bash</span>
          </div>

          <div className="px-6 py-5 font-mono text-sm text-left space-y-2">
            <p>
              <span className="text-violet-400">~</span>
              <span className="text-white/40"> $ </span>
              <span className="text-white/80">
                git checkout <span className="text-cyan-400">this-page</span>
              </span>
            </p>
            <p className="text-red-400/80 ">
              {' '}
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

        <div className="flex flex-col sm:flex-row gap-3 w-full">
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

        {/* <p className="text-white/20 text-xs font-mono">exit code 404 · no such file or directory</p> */}
      </div>
    </main>
  );
}
