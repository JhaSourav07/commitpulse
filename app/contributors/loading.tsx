export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black transition-colors dark:bg-black dark:text-white">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />

        <p className="text-zinc-500 dark:text-zinc-400">Loading contributors...</p>

        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Fetching contributor data from GitHub
        </p>
      </div>
    </div>
  );
}
