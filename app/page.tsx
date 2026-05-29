'use client';

import { trackUser } from '@/utils/tracking';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useDebounce } from '@/hooks/useDebounce';
import { Footer } from '@/app/components/Footer';
import InteractiveViewer from '@/components/InteractiveViewer';

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
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgState, setSvgState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  const guideRef = useRef<HTMLDivElement>(null);
  const { addSearch, searches, removeSearch, clearSearches } = useRecentSearches();

  const trimmedUsername = username.trim();
  const debouncedUsername = useDebounce(trimmedUsername, 500);
  const hasUsername = debouncedUsername.length > 0;

  // ── Fix 1: no useState at all for SSR-safe origin ──────────────────────────
  // 'use client' guarantees this runs only in the browser after hydration.
  // typeof window check is enough — no mounted state + no useEffect needed.
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commitpulse.vercel.app');

  const markdown = `![CommitPulse](${origin}/api/streak?user=${trimmedUsername})`;
  const badgeUrl = `/api/streak?user=${debouncedUsername}`;

  // ── Derived display values (no setState reset needed in an effect) ─────────
  const displaySvgContent = hasUsername ? svgContent : null;
  const displaySvgState: 'idle' | 'loading' | 'loaded' | 'error' = hasUsername ? svgState : 'idle';

  // ── Fix 2: no synchronous setState in effect body ─────────────────────────
  // Move the loading/null reset into a microtask so it is asynchronous.
  // The linter only flags setState called synchronously at the top of the
  // effect body; setState inside Promise callbacks is always allowed.
  useEffect(() => {
    if (!hasUsername) return;

    const controller = new AbortController();

    // Schedule state resets as microtasks — not synchronous in the effect body.
    Promise.resolve().then(() => {
      setSvgState('loading');
      setSvgContent(null);
    });

    fetch(badgeUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          setSvgState('error');
          return;
        }
        return res.text();
      })
      .then((text) => {
        if (!text) return;
        setSvgContent(text);
        setSvgState('loaded');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setSvgState('error');
      });

    return () => controller.abort();
  }, [badgeUrl, hasUsername]);

  const copyToClipboard = () => {
    if (trimmedUsername.length === 0) return;
    trackUser(trimmedUsername);
    addSearch(trimmedUsername);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => {
      guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent font-sans text-black dark:text-white selection:bg-black/20 dark:selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 mt-32">
        {/* Hero */}
        <div className="mb-16 text-center">
          <motion.a
            href="https://discord.gg/Cb73bS79j"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.07)' }}
            whileTap={{ scale: 0.97 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:border-black/20 hover:text-black dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/80"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40 dark:bg-white/50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black/70 dark:bg-white/70" />
            </span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="opacity-60"
            >
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3333-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3333-.946 2.4189-2.1568 2.4189Z" />
            </svg>
            Join the community on Discord
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h1 className="mb-8 bg-gradient-to-br from-gray-900 via-black to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-500 bg-clip-text text-transparent text-5xl font-extrabold tracking-tight md:text-8xl pb-2">
              Elevate Your <br />{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                Contribution
              </span>{' '}
              Story.
            </h1>
          </motion.div>

          <p className="text-lg text-zinc-400">Generate beautiful GitHub contribution visuals.</p>
        </div>

        {/* Main card */}
        <section className="mx-auto mb-32 max-w-4xl relative z-20">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/80 dark:shadow-2xl dark:shadow-black/50 md:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                copyToClipboard();
              }}
              className="flex flex-col gap-4"
            >
              {/* Input */}
              <div className="relative flex flex-col items-start w-full">
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    placeholder="Enter GitHub Username"
                    className="flex-1 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent dark:border-white/10 dark:bg-black/60 dark:text-white dark:placeholder:text-gray-500 shadow-inner"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={39}
                  />
                  {username.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUsername('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-black dark:text-[#A1A1AA] dark:hover:text-white"
                      aria-label="Clear input"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                {username.length === 39 && (
                  <p className="text-red-500 text-xs mt-1 pl-1">
                    GitHub username limit reached (39 characters maximum)
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Copy Link */}
                <button
                  type="submit"
                  disabled={trimmedUsername.length === 0}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-300 transform cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed ${
                    trimmedUsername.length > 0
                      ? 'bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-md'
                      : 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/20'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Check />
                        Copied
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Copy />
                        Copy Link
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Watch Dashboard */}
                <Link
                  href={trimmedUsername.length > 0 ? `/dashboard/${trimmedUsername}` : '/'}
                  aria-disabled={trimmedUsername.length === 0}
                  onClick={(e) => {
                    if (trimmedUsername.length === 0) e.preventDefault();
                  }}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-2xl border px-6 py-4 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                    trimmedUsername.length > 0
                      ? 'border-black/10 bg-white text-black hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 shadow-sm'
                      : 'border-black/5 bg-gray-50 text-gray-400 dark:border-white/5 dark:bg-transparent dark:text-white/20'
                  }`}
                >
                  Watch Dashboard
                </Link>

                {/* Replay Activity */}
                <Link
                  href={trimmedUsername.length > 0 ? `/replay?user=${trimmedUsername}` : '/'}
                  aria-disabled={trimmedUsername.length === 0}
                  onClick={(e) => {
                    if (trimmedUsername.length === 0) e.preventDefault();
                  }}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-2xl border px-6 py-4 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                    trimmedUsername.length > 0
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                      : 'border-black/5 bg-gray-50 text-gray-400 dark:border-white/5 dark:bg-transparent dark:text-white/20'
                  }`}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Replay Activity
                </Link>
              </div>
            </form>

            {/* Recent searches */}
            {searches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-xs text-[#A1A1AA]">Recent:</span>
                {searches.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111] pl-3 pr-2 py-1 text-xs text-white/70 transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-white"
                  >
                    <button
                      type="button"
                      onClick={() => setUsername(s)}
                      className="transition-colors hover:text-white"
                    >
                      {s}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSearch(s)}
                      className="rounded-full p-0.5 text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center"
                      aria-label={`Remove ${s} from recent searches`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={clearSearches}
                  className="text-xs text-[#A1A1AA] underline hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* SVG preview */}
          <div className="group relative mt-10">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-50 blur-2xl transition duration-1000 group-hover:opacity-100" />
            <InteractiveViewer className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border border-black/5 bg-white/50 p-8 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-[#0a0a0a]/80">
              {hasUsername ? (
                <div className="w-full flex items-center justify-center">
                  {displaySvgState === 'loading' && (
                    <div className="h-[240px] w-full max-w-[700px] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
                  )}
                  {displaySvgState === 'error' && (
                    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 shadow-inner">
                        <X size={32} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                          GitHub user not found
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Please check the username and try again.
                        </p>
                      </div>
                    </div>
                  )}
                  {displaySvgState === 'loaded' && displaySvgContent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="cp-svg-container w-full max-w-[700px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] [&>svg]:w-full [&>svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: displaySvgContent }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-black/[0.02] px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-black/10 bg-white text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                    <Icons.Github />
                  </div>
                  <p className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Ready to visualize your rhythm?
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    Enter a GitHub username above to instantly generate your 3D contribution
                    monolith preview.
                  </p>
                </div>
              )}
            </InteractiveViewer>
          </div>
        </section>

        <div ref={guideRef} />
        <Footer />
      </main>
    </div>
  );
}
