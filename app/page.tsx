'use client';

import { trackUser } from '@/utils/tracking';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { Footer } from '@/app/components/Footer';

const Icons = {
  Github: () => (
    <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  ),

  Copy: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),

  Check: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10b981"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);

  const guideRef = useRef<HTMLDivElement>(null);

  const { addSearch } = useRecentSearches();

  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;

  const markdown = `![CommitPulse](https://commitpulse.vercel.app/api/streak?user=${trimmedUsername})`;

  const copyToClipboard = () => {
    if (!hasUsername) return;

    trackUser(trimmedUsername);
    addSearch(trimmedUsername);

    navigator.clipboard.writeText(markdown);

    setCopied(true);

    setTimeout(() => {
      guideRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-6xl font-bold">Elevate Your Contribution Story</h1>

          <p className="text-lg text-zinc-400">Generate beautiful GitHub contribution visuals.</p>
        </div>

        <section className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                copyToClipboard();
              }}
              className="flex flex-col gap-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter GitHub Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-zinc-800 px-5 py-4 text-white outline-none"
                />

                {username.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={!hasUsername}
                  className={`rounded-xl px-6 py-4 font-semibold transition ${
                    hasUsername ? 'bg-white text-black' : 'bg-zinc-700 text-zinc-400'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="copied"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Check />
                        Copied
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Copy />
                        Copy Link
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <Link
                  href={hasUsername ? `/dashboard/${trimmedUsername}` : '/'}
                  onClick={(e) => {
                    if (!hasUsername) {
                      e.preventDefault();
                    }
                  }}
                  className={`rounded-xl border px-6 py-4 text-center font-semibold transition ${
                    hasUsername
                      ? 'border-white/20 bg-zinc-800 hover:bg-zinc-700'
                      : 'border-white/10 bg-zinc-900 text-zinc-500'
                  }`}
                >
                  Watch Dashboard
                </Link>

                <Link
                  href={hasUsername ? `/replay?user=${trimmedUsername}` : '/'}
                  onClick={(e) => {
                    if (!hasUsername) {
                      e.preventDefault();
                    }
                  }}
                  className={`rounded-xl border px-6 py-4 text-center font-semibold transition ${
                    hasUsername
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                      : 'border-white/10 bg-zinc-900 text-zinc-500'
                  }`}
                >
                  ⚡ Replay Activity
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900 p-10 text-center">
            {hasUsername ? (
              <p className="text-zinc-300">
                Preview for:
                <span className="ml-2 font-bold text-white">{trimmedUsername}</span>
              </p>
            ) : (
              <p className="text-zinc-500">Enter a GitHub username to preview</p>
            )}
          </div>
        </section>

        <div ref={guideRef} />

        <Footer />
      </main>
    </div>
  );
}
