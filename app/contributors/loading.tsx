export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#050505] text-black dark:text-white">
      <div
        className="flex flex-col items-center gap-6"
        role="status"
        aria-live="polite"
        aria-label="Loading contributors"
      >
        {/* Pulsing ring loader */}
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-black/10 dark:border-white/10 border-t-cyan-400" />
          <div className="absolute inset-0 h-16 w-16 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
