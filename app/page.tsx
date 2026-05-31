'use client';
import { trackUser } from '@/utils/tracking';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { CommitPulseLogo } from '@/components/commitpulse-logo';
import { CustomizeCTA } from './components/CustomizeCTA';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useDebounce } from '@/hooks/useDebounce';
import { Footer } from '@/app/components/Footer';

import { FeatureCard, FeatureCardsSection } from '@/components/FeatureCards';
import { DiscordButton } from '@/components/DiscordButton';
import { WallOfLove } from '@/components/WallOfLove';

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
  // Track which username's badge result we have. Derived booleans auto-reset
  // when debouncedUsername changes — no useEffect needed.
  const [badgeResult, setBadgeResult] = useState<{
    username: string;
    status: 'loaded' | 'error';
  } | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const { searches, addSearch, clearSearches, removeSearch } = useRecentSearches();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const trimmedUsername = username.trim();
  const debouncedUsername = useDebounce(trimmedUsername, 500);
  const hasUsername = debouncedUsername.length > 0;

  const badgeUrl = `/api/streak?user=${debouncedUsername}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://commitpulse.vercel.app';
  const markdown = `![CommitPulse](${siteUrl}/api/streak?user=${trimmedUsername})`;

  // Derived — automatically false when debouncedUsername changes
  const badgeLoaded =
    badgeResult?.username === debouncedUsername && badgeResult?.status === 'loaded';
  const badgeError = badgeResult?.username === debouncedUsername && badgeResult?.status === 'error';

  const copyToClipboard = () => {
    if (trimmedUsername.length === 0) return;

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
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 mt-32">
        <div className="mb-16 text-center">
          <DiscordButton />

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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-sm sm:text-lg leading-relaxed text-gray-600 dark:text-white/65 md:text-xl "
          >
            CommitPulse converts your GitHub commit history into a live, 3D animated badge. The more
            you commit, the taller your city grows! Embed it in your profile README with one line.
          </motion.p>
        </div>

        <section className="mx-auto mb-32 max-w-4xl relative z-20">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/80 dark:shadow-2xl dark:shadow-black/50 md:p-8">
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
                    suppressHydrationWarning
                    placeholder="Enter GitHub Username"
                    className="flex-1 rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent dark:border-white/10 dark:bg-black/60 dark:text-white dark:placeholder:text-gray-500 shadow-inner"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={39}
                  />
                  {username.length > 0 ? (
                    <button
                      onClick={() => setUsername('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-black dark:text-white/65 dark:hover:text-white"
                      aria-label="Clear input"
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>
                {mounted && username.length === 0 && (
                  <p className="text-amber-500 text-xs mt-1 self-start pl-1">
                    Please enter a GitHub username to copy your badge link.
                  </p>
                )}
                {username.length === 39 && (
                  <p className="text-red-500 text-xs mt-1 self-start pl-1">
                    GitHub username limit reached (39 characters maximum)
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={!mounted || trimmedUsername.length === 0}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-300 transform cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed ${
                    mounted && trimmedUsername.length > 0
                      ? 'bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 shadow-md'
                      : 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/55'
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
                  href={
                    mounted && trimmedUsername.length > 0 ? `/dashboard/${trimmedUsername}` : '/'
                  }
                  suppressHydrationWarning
                  aria-disabled={!mounted || trimmedUsername.length === 0}
                  onClick={(e) => {
                    if (!mounted || trimmedUsername.length === 0) {
                      e.preventDefault();
                    } else {
                      trackUser(trimmedUsername);
                      addSearch(trimmedUsername);
                    }
                  }}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-2xl border px-6 py-4 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                    mounted && trimmedUsername.length > 0
                      ? 'border-black/10 bg-white text-black hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 shadow-sm'
                      : 'border-black/5 bg-gray-50 text-gray-400 dark:border-white/5 dark:bg-transparent dark:text-white/55'
                  }`}
                >
                  Watch Dashboard
                </Link>
              </div>
            </form>
          </div>

          {searches.length > 0 && (
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

          <div className="group relative mt-10">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 opacity-50 blur-2xl transition duration-1000 group-hover:opacity-100" />
            <div className="relative flex min-h-[480px] md:min-h-[520px] items-center justify-center overflow-hidden rounded-3xl border border-black/5 bg-white/50 p-8 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-[#0a0a0a]/80">
              {hasUsername ? (
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  {!badgeLoaded && !badgeError && (
                    <div className="h-[240px] w-full max-w-[700px] rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse" />
                  )}
                  {badgeError && (
                    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 shadow-inner">
                        <X size={32} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                          GitHub user not found
                        </p>
                        <p className="text-sm text-gray-500 dark:text-white/65 mt-1">
                          Please check the username and try again.
                        </p>
                      </div>
                    </div>
                  )}
                  <motion.img
                    key={badgeUrl}
                    data-testid="badge-img"
                    src={badgeUrl}
                    alt={`CommitPulse badge for ${debouncedUsername}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: badgeLoaded ? 1 : 0, scale: badgeLoaded ? 1 : 0.95 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-[700px] h-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                    onLoad={() => setBadgeResult({ username: debouncedUsername, status: 'loaded' })}
                    onError={() => setBadgeResult({ username: debouncedUsername, status: 'error' })}
                  />
                </div>
              ) : (
                <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-black/[0.02] px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.02]">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-black/10 bg-white text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                    <Icons.Github />
                  </div>
                  <p className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Ready to visualize your rhythm?
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500 dark:text-white/65">
                    Enter a GitHub username above to instantly generate your streak badge.
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

        <FeatureCardsSection>
          <FeatureCard
            icon={<Icons.Zap />}
            accent="text-white"
            accentColor="#10b981"
            index={0}
            title="Real-time Sync"
            desc="Pulled directly from GitHub GraphQL API. Your streak updates as fast as your code pushes."
          />
          <FeatureCard
            icon={<Icons.Copy />}
            accent="text-white"
            accentColor="#8b5cf6"
            index={1}
            title="Theme Engine"
            desc="Switch between Neon, Dracula, or custom HEX modes via simple URL management."
          />
          <FeatureCard
            icon={<Icons.Box />}
            accent="text-white"
            accentColor="#06b6d4"
            index={2}
            title="Isometric Math"
            desc="Sophisticated 3D projection formulas turn 2D data into digital architecture."
          />
        </FeatureCardsSection>

        <WallOfLove />

        <Footer />
      </main>
    </div>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Open Your Profile Repo',
    body: 'Navigate to github.com/YOUR_USERNAME/YOUR_USERNAME - your special profile repository.',
  },
  {
    n: '02',
    title: 'Edit README.md',
    body: "Click the pencil icon to open the file in GitHub's built-in editor.",
  },
  {
    n: '03',
    title: 'Paste the Snippet',
    body: 'Place your cursor wherever you want the monolith to appear, then paste (Ctrl+V / Cmd+V).',
  },
  {
    n: '04',
    title: 'Save & Ship It',
    body: 'Click "Commit changes" and visit your profile. Your 3D streak is now live.',
  },
];

function SuccessGuide({
  markdown,
  username,
  onDismiss,
}: {
  markdown: string;
  username: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      key="success-guide"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="mx-auto mb-12 max-w-4xl"
    >
      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-white dark:border-[rgba(255,255,255,0.1)] dark:bg-[#0a0a0a]">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-white/3 blur-[80px]" />

        <div className="flex items-start justify-between border-b border-black/10 px-8 pb-6 pt-8 dark:border-white/5">
          <div className="flex items-center gap-4">
            <span className="relative mt-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40 opacity-40 dark:bg-white/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-black dark:bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
            </span>
            <div>
              <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-gray-500 dark:text-[#A1A1AA]">
                Markdown Copied
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-black dark:text-white">
                Your Monolith is Ready - Deploy It in 4 Steps
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="ml-4 mt-1 shrink-0 rounded-xl p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-black dark:text-white/55 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Dismiss guide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid gap-px border-b border-black/10 bg-black/5 dark:border-white/5 dark:bg-white/5 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="flex gap-4 bg-white p-6 dark:bg-[#050505]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-gray-100 text-xs font-bold tracking-widest text-gray-600 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111] dark:text-[#A1A1AA]">
                {step.n}
              </span>
              <div>
                <p className="mb-1 text-sm font-bold text-black dark:text-white">{step.title}</p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-500">
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-8 py-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-white/55">
            Your copied snippet
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-gray-100 px-4 py-3 font-mono text-sm dark:border-white/8 dark:bg-black/60">
            <span className="shrink-0 select-none text-gray-500 dark:text-[#A1A1AA]">$</span>
            <code className="flex-1 overflow-x-auto break-all leading-relaxed text-black dark:text-white/80">
              {markdown}
            </code>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-white/55">
            Tip: Add <code className="text-gray-700 dark:text-white/55">?accent=808080</code> to the
            URL to change your monolith&apos;s colour palette.
          </p>
          <div className="mt-8 flex justify-center border-t border-black/10 pt-6 dark:border-white/5">
            <Link href={`/dashboard/${username}`} onClick={() => trackUser(username)}>
              <span className="border border-black/10 bg-gray-100 px-6 py-2.5 rounded-lg text-sm font-semibold text-black transition-all duration-200 hover:bg-gray-200 hover:scale-[1.01] active:scale-[0.99] dark:border-[rgba(255,255,255,0.15)] dark:bg-white dark:text-black dark:hover:bg-zinc-100">
                Watch Your Dashboard
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
