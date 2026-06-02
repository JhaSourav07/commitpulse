export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="flex flex-col items-center gap-6" role="status" aria-live="polite">
        {/* Pulsing ring loader */}
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <div className="absolute inset-0 h-16 w-16 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
        </div>

        <p className="text-zinc-400 font-light text-lg">Loading the collective...</p>

        <p className="text-sm text-zinc-600 font-mono">Fetching contributor data from GitHub</p>
      </div>
    </div>
  );
}
