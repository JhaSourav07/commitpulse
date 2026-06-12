'use client';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <main className="relative min-h-screen text-white overflow-hidden flex flex-col items-center justify-center font-sans py-20 px-4">
          <div className="relative z-10 flex flex-col items-center justify-center gap-8 max-w-lg w-full text-center">
            <h1 className="text-6xl font-black text-red-500">500</h1>
            <p className="text-xl text-white/80">A critical error occurred at the root level.</p>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left w-full overflow-auto">
              <code className="text-sm text-red-400 font-mono">
                {error.message || 'Unknown global error'}
              </code>
            </div>
            <button
              onClick={() => reset()}
              className="py-3 px-6 rounded-xl font-semibold text-sm text-white text-center transition-all bg-red-500 hover:bg-red-600"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
