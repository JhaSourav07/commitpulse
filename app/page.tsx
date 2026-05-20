'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { CommitPulseLogo } from '@/components/commitpulse-logo';
import { CustomizeCTA } from './components/CustomizeCTA';

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

function trackUser(name: string) {
  const payload = JSON.stringify({ username: name });
  // sendBeacon is truly fire-and-forget — it doesn't block navigation
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track-user', new Blob([payload], { type: 'application/json' }));
  } else {
    fetch('/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(console.error);
  }
}

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);
  const trimmedUsername = username.trim();
  const hasUsername = trimmedUsername.length > 0;

  const badgeUrl = `/api/streak?user=${trimmedUsername}`;
  const markdown = `![CommitPulse](https://commitpulse.vercel.app/api/streak?user=${trimmedUsername})`;

  const copyToClipboard = () => {
    if (!hasUsername) return;

    trackUser(trimmedUsername);

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => {
      guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setTimeout(() => setCopied(false), 50000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent font-sans text-white selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-white/3 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-white/2 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
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
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/50 backdrop-blur-sm transition-colors duration-200 hover:border-white/20 hover:text-white/80"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/70" />
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
            <h1 className="mb-8 bg-linear-to-b from-white to-white/30 bg-clip-text text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent md:text-8xl ">
              Elevate Your <br /> Contribution Story.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-md sm:text-lg leading-relaxed text-gray-400 md:text-xl "
          >
            Stop settling for flat grids. Generate high-fidelity, 3D isometric monoliths that
            visualize your coding rhythm with professional precision.
          </motion.p>
        </div>

        <section className="mx-auto mb-32 max-w-4xl">
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-4 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="Enter GitHub Username"
                  className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111] px-5 py-3.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00ffaa] focus:border-transparent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                {username.length > 0 ? (
                  <button
                    onClick={() => setUsername('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] transition-colors hover:text-white"
                    aria-label="Clear input"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={copyToClipboard}
                  disabled={!hasUsername}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    hasUsername
                      ? 'bg-white text-black hover:bg-zinc-100'
                      : 'bg-white/10 text-white/35'
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
                  aria-disabled={!hasUsername}
                  onClick={(e) => {
                    if (!hasUsername) {
                      e.preventDefault();
                    } else {
                      trackUser(trimmedUsername);
                    }
                  }}
                  className={`relative flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-xl border px-6 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    hasUsername
                      ? 'border-[rgba(255,255,255,0.15)] bg-transparent text-white hover:bg-white/5'
                      : 'border-[rgba(255,255,255,0.08)] bg-white/[0.02] text-white/35'
                  }`}
                >
                  Watch Dashboard
                </Link>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 rounded-[2rem] bg-white/5 opacity-50 blur-xl transition duration-1000 group-hover:opacity-100" />
              <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-black p-6">
                {hasUsername ? (
                  <Image
                    src={badgeUrl}
                    alt="CommitPulse preview"
                    width={900}
                    height={600}
                    unoptimized
                    loading="eager"
                    priority
                    className="h-auto max-w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60">
                      <Icons.Github />
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-white">
                      Enter a GitHub username to preview
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">
                      Your 3D contribution monolith will appear here as soon as you add a username.
                    </p>
                  </div>
                )}
              </div>
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
            accent="text-white"
            title="Real-time Sync"
            desc="Pulled directly from GitHub GraphQL API. Your streak updates as fast as your code pushes."
          />
          <FeatureCard
            icon={<Icons.Copy />}
            accent="text-white"
            title="Theme Engine"
            desc="Switch between Neon, Dracula, or custom HEX modes via simple URL management."
          />
          <FeatureCard
            icon={<Icons.Box />}
            accent="text-white"
            title="Isometric Math"
            desc="Sophisticated 3D projection formulas turn 2D data into digital architecture."
          />
        </div>

        <footer className="mt-32 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 text-sm text-white/30 md:flex-row">
          <p>&copy; 2026 CommitPulse. Designed for the elite builder community.</p>
          <div className="flex gap-8">
            <Link href="/documentation" className="transition-colors hover:text-white">
              Documentation
            </Link>
            <a
              href="https://github.com/jhasourav07"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              Creator
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-8 hover:border-[rgba(255,255,255,0.14)] hover:bg-[#0d0d0d] transition-all duration-200"
    >
      <div className={`mb-5 w-fit rounded-lg bg-[#111] p-2.5 ${accent}`}>{icon}</div>
      <h3 className="mb-2 text-sm font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-[#A1A1AA]">{desc}</p>
    </motion.div>
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
      <div className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0a]">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-white/3 blur-[80px]" />

        <div className="flex items-start justify-between border-b border-white/5 px-8 pb-6 pt-8">
          <div className="flex items-center gap-4">
            <span className="relative mt-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-30" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <div>
              <p className="mb-0.5 text-xs font-medium uppercase tracking-[0.2em] text-[#A1A1AA]">
                Markdown Copied
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                Your Monolith is Ready - Deploy It in 4 Steps
              </h2>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="ml-4 mt-1 shrink-0 rounded-xl p-2 text-white/30 transition-all hover:bg-white/5 hover:text-white"
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

        <div className="grid gap-px border-b border-white/5 bg-white/5 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="flex gap-4 bg-[#050505] p-6"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111] text-xs font-bold tracking-widest text-[#A1A1AA]">
                {step.n}
              </span>
              <div>
                <p className="mb-1 text-sm font-bold text-white">{step.title}</p>
                <p className="text-sm leading-relaxed text-gray-500">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="px-8 py-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-white/30">
            Your copied snippet
          </p>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/60 px-4 py-3 font-mono text-sm">
            <span className="shrink-0 select-none text-[#A1A1AA]">$</span>
            <code className="flex-1 overflow-x-auto break-all leading-relaxed text-white/80">
              {markdown}
            </code>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/25">
            Tip: Add <code className="text-white/40">?accent=808080</code> to the URL to change your
            monolith&apos;s colour palette.
          </p>
          <div className="mt-8 flex justify-center border-t border-white/5 pt-6">
            <Link href={`/dashboard/${username}`} onClick={() => trackUser(username)}>
              <button className="bg-white text-black hover:bg-zinc-100 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
                Watch Your Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
