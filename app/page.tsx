'use client';
import { trackUser } from '@/utils/tracking';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { CommitPulseLogo } from '@/components/commitpulse-logo';
import { CustomizeCTA } from './components/CustomizeCTA';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { Footer } from '@/app/components/Footer';

// Fixed relative path import to bypass the ts(2307) module resolution error
import { FeatureCard } from '@/app/components/FeatureCard';

interface SuccessGuideProps {
  markdown: string;
  username: string;
  onDismiss: () => void;
}

const SuccessGuide = ({ markdown, username, onDismiss }: SuccessGuideProps) => {
  return (
    <motion.div
      // Fixed Framer motion syntax errors by substituting 'h' with explicit 'height' types
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 relative overflow-hidden"
    >
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 text-gray-500 hover:text-white"
        type="button"
      >
        <X size={16} />
      </button>
      <h3 className="text-lg font-bold text-emerald-400 mb-2">🎉 Successfully Generated!</h3>
      <p className="text-sm text-gray-400 mb-4">
        The Markdown markdown code for <span className="text-white font-semibold">@{username}</span>{' '}
        has been copied to your clipboard. You can paste it directly into your GitHub README.md
        profile.
      </p>
      <pre className="p-3 bg-black/50 border border-white/10 rounded-xl text-xs text-emerald-300 overflow-x-auto select-all">
        {markdown}
      </pre>
    </motion.div>
  );
};

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
  Zap: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z" />
    </svg>
  ),
  Box: () => <CommitPulseLogo className="h-6 w-6" />,
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
  const { searches, addSearch, clearSearches, removeSearch } = useRecentSearches();
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const badgeUrl = `/api/streak?user=${trimmedUsername}`;
  const markdown = `![CommitPulse](https://commitpulse.vercel.app/api/streak?user=${trimmedUsername})`;

  const [prevUsername, setPrevUsername] = useState('');
  if (trimmedUsername !== prevUsername) {
    setPrevUsername(trimmedUsername);
    setSvgContent(null);
    setSvgState(trimmedUsername ? 'loading' : 'idle');
  }

  useEffect(() => {
    if (!hasUsername) return;

    const controller = new AbortController();

    fetch(badgeUrl, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
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
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setSvgState('error');
      });
    return () => controller.abort();
  }, [badgeUrl, hasUsername]);

  const copyToClipboard = () => {
    if (!hasUsername) return;

    trackUser(trimmedUsername);
    addSearch(trimmedUsername);

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => {
      guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setTimeout(() => setCopied(false), 50000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent font-sans text-black dark:text-white selection:bg-black/20 dark:selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-white/3 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-white/2 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 mt-32">
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
            <h1 className="mb-8 bg-gradient-to-b from-black to-black/40 dark:from-white dark:to-white/30 bg-clip-text text-transparent sm:text-5xl font-extrabold tracking-tight md:text-8xl">
              Elevate Your <br /> Contribution Story.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-sm sm:text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl "
          >
            Stop settling for flat grids. Generate high-fidelity, 3D isometric monoliths that
            visualize your coding rhythm with professional precision.
          </motion.p>
        </div>

        <section className="mx-auto mb-32 max-w-4xl">
          <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#0a0a0a] md:p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                copyToClipboard();
              }}
              className="flex flex-col sm:flex-row gap-4 w-full"
            >
              <div className="relative flex-1 flex items-center flex-col">
                <div className="relative flex-1 flex items-center w-full">
                  <input
                    type="text"
                    placeholder="Enter GitHub Username"
                    className="flex-1 rounded-xl border border-black/10 bg-gray-100 px-5 py-3.5 text-sm text-black outline-none transition-all duration-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ffaa] focus:border-transparent dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111] dark:text-white dark:placeholder:text-[#A1A1AA]"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={39}
                  />
                  {username.length > 0 ? (
                    <button
                      onClick={() => setUsername('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-black dark:text-[#A1A1AA] dark:hover:text-white"
                      aria-label="Clear input"
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
                {username.length === 39 && (
                  <p className="text-red-500 text-xs mt-1 self-start pl-1">
                    GitHub username limit reached (39 characters maximum)
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={!mounted || !hasUsername}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 transform cursor-pointer hover:scale-105 hover:brightness-125 active:scale-[0.98] disabled:cursor-not-allowed ${
                    hasUsername
                      ? 'bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100'
                      : 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-white/35'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ y: 10 }}
                        animate={{ y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Check /> Copied
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Icons.Copy /> Copy Link
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <Link
                  href={hasUsername ? `/dashboard/${trimmedUsername}` : '/'}
                  aria-disabled={!mounted || !hasUsername}
                  onClick={(e) => {
                    if (!hasUsername) {
                      e.preventDefault();
                    } else {
                      trackUser(trimmedUsername);
                      addSearch(trimmedUsername);
                    }
                  }}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl border px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    hasUsername
                      ? 'border-black/10 bg-gray-100 text-black hover:bg-gray-200 dark:border-[rgba(255,255,255,0.15)] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10'
                      : 'border-black/10 bg-gray-100 text-gray-500 dark:border-[rgba(255,255,255,0.08)] dark:bg-white/[0.02] dark:text-white/35'
                  }`}
                >
                  Watch Dashboard
                </Link>
              </div>
            </form>
          </div>

          {mounted && searches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 mt-3">
              <span className="text-xs text-[#A1A1AA]">Recent:</span>
              {searches.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111] pl-3 pr-2 py-1 text-xs text-white/70 transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-white group/pill"
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
                onClick={clearSearches}
                className="text-xs text-[#A1A1AA] underline hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <div className="group relative">
            <div className="absolute -inset-1 rounded-[2rem] bg-white/5 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100" />
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white p-6 dark:border-[rgba(255,255,255,0.06)] dark:bg-black">
              {hasUsername ? (
                <div className="w-full flex items-center justify-center">
                  {svgState === 'loading' && (
                    <div className="h-[200px] w-full max-w-[600px] rounded-xl bg-white/5 animate-pulse" />
                  )}
                  {svgState === 'error' && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                        <X size={28} className="text-red-400" />
                      </div>
                      <p className="text-base font-semibold text-white">GitHub user not found</p>
                      <p className="text-sm text-[#A1A1AA]">
                        Please check the username and try again.
                      </p>
                    </div>
                  )}
                  {svgState === 'loaded' && svgContent && (
                    <div
                      className="cp-svg-container w-full max-w-[600px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] [&>svg]:w-full [&>svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-gray-100 px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-white text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                    <Icons.Github />
                  </div>
                  <p className="md:text-lg text-md font-semibold tracking-tight text-black dark:text-white">
                    Enter a GitHub username to preview
                  </p>
                  <p className="mt-2 max-w-md text-xs xs:text-sm leading-relaxed text-gray-600 dark:text-[#A1A1AA]">
                    Your 3D contribution monolith will appear here as soon as you add a username.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div ref={guideRef}>
          <AnimatePresence>
            {copied && (
              <SuccessGuide
                markdown={markdown}
                username={trimmedUsername}
                onDismiss={() => setCopied(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <CustomizeCTA />

        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Icons.Zap />}
            accent="text-black dark:text-white"
            title="Real-time Sync"
            desc="Pulled directly from GitHub GraphQL API. Your streak updates as fast as your code pushes."
          />
          <FeatureCard
            icon={<Icons.Copy />}
            accent="text-black dark:text-white"
            title="Theme Engine"
            desc="Switch between Neon, Dracula, or custom HEX modes via simple URL management."
          />
          <FeatureCard
            icon={<Icons.Box />}
            accent="text-black dark:text-white"
            title="Isometric Math"
            desc="Sophisticated 3D projection formulas turn 2D data into digital architecture."
          />
        </div>
        <Footer />
      </main>
    </div>
  );
}
