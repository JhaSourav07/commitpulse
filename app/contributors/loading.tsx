export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />

        <p className="text-zinc-400">Loading contributors...</p>
      </div>
    </div>
  );
}
