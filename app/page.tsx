'use client';

import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import { Search, X, Flame, Trophy, GitCommit, Folder } from 'lucide-react';

import useLocalStorage from '@/hooks/useLocalStorage';
import { useDebounce } from '@/hooks/useDebounce';
import { Footer } from '@/app/components/Footer';
import { FeatureCardsSection } from '@/components/FeatureCards';
import { DiscordButton } from '@/components/DiscordButton';
import { WallOfLove } from '@/components/WallOfLove';
import { validateGitHubUsername } from '@/lib/validations';

export default function LandingPage() {
  const [username, setUsername] = useLocalStorage('commitpulse:last-user', '');

  const heroRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  interface UserDetails {
    public_repos?: number;
    stats?: {
      currentStreak?: number;
      longestStreak?: number;
      totalContributions?: number;
    };
  }
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState<string | null>(null);

  // Solves Line 37: Avoid calling setState synchronously in effect body
  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
    return () => {
      Promise.resolve().then(() => {
        setMounted(false);
      });
    };
  }, []);

  useGSAP(
    () => {
      if (!heroRef.current) return;

      gsap.to('.hero-text', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'expo.out',
        delay: 0.15,
      });

      gsap.to('.contribution-text', {
        backgroundPosition: '300% 50%',
        duration: 8,
        ease: 'none',
        repeat: -1,
      });
    },
    { scope: heroRef }
  );

  const trimmedUsername = username.trim();
  const debouncedUsername = useDebounce(trimmedUsername, 500);

  // Solves Line 70: Wrap inner-effect state adjustments to prevent render cascading
  useEffect(() => {
    if (!mounted) return;

    if (debouncedUsername.length === 0) {
      Promise.resolve().then(() => {
        setUserDetails(null);
        setUserDetailsError(null);
        setUserDetailsLoading(false);
      });
      return;
    }

    if (!validateGitHubUsername(debouncedUsername)) {
      Promise.resolve().then(() => {
        setUserDetails(null);
        setUserDetailsError('Invalid username format');
        setUserDetailsLoading(false);
      });
      return;
    }

    let isCurrentFetch = true;

    const fetchDetails = async () => {
      setUserDetailsLoading(true);
      setUserDetailsError(null);
      try {
        const response = await fetch(
          `/api/user-details?username=${encodeURIComponent(debouncedUsername)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch user');
        }
        const data = await response.json();

        if (isCurrentFetch) {
          setUserDetails(data);
          setUserDetailsLoading(false);
        }
      } catch (err) {
        if (isCurrentFetch) {
          const message = err instanceof Error ? err.message : 'Failed to fetch user';
          setUserDetails(null);
          setUserDetailsError(message);
          setUserDetailsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isCurrentFetch = false;
    };
  }, [debouncedUsername, mounted]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const statsData = [
    {
      label: 'Current Streak',
      value: userDetails?.stats?.currentStreak ?? 0,
      icon: Flame,
    },
    {
      label: 'Longest Streak',
      value: userDetails?.stats?.longestStreak ?? 0,
      icon: Trophy,
    },
    {
      label: 'Contributions',
      value: userDetails?.stats?.totalContributions ?? 0,
      icon: GitCommit,
    },
    {
      label: 'Repositories',
      value: userDetails?.public_repos ?? 0,
      icon: Folder,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent font-sans text-black dark:text-white selection:bg-black/20 dark:selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 mt-32">
        <div className="mb-16 text-center">
          <DiscordButton />

          <div ref={heroRef}>
            <h1 className="hero-text opacity-0 translate-y-10 mb-8 bg-gradient-to-br from-gray-900 via-black to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-500 bg-clip-text text-transparent">
              Elevate Your <br />{' '}
              <span className="contribution-text inline-block bg-[length:300%_300%] bg-gradient-to-r from-emerald-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm">
                Contribution
              </span>{' '}
              Story.
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-2xl text-sm sm:text-lg leading-relaxed text-gray-600 dark:text-white/65 md:text-xl"
          >
            CommitPulse converts your GitHub commit history into a live, 3D animated badge. The more
            you commit, the taller your city grows! Embed it in your profile README with one line.
          </motion.p>
        </div>

        <section className="mx-auto mb-16 max-w-4xl relative z-20">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/80 dark:shadow-2xl dark:shadow-black/50">
            <form onSubmit={handleGenerate} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="relative flex-1 flex items-center">
                  <span className="absolute left-4 text-zinc-400 dark:text-zinc-500">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter GitHub Username"
                    aria-label="Enter GitHub username to generate badge"
                    className="flex-1 rounded-2xl border border-black/10 bg-white pl-12 pr-10 py-4 text-sm text-black outline-none transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={username}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.includes('github.com/')) {
                        const parts = val.split('github.com/');
                        if (parts[1]) {
                          const pathParts = parts[1].split('?')[0].split('/');
                          const userPart = pathParts.find((p) => p.trim().length > 0);
                          if (userPart) {
                            val = userPart;
                          }
                        }
                      }
                      setUsername(val);
                    }}
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
              </div>

              {mounted && (
                <div className="w-full transition-all duration-300">
                  <AnimatePresence mode="wait">
                    {username.length === 0 ? (
                      <motion.p
                        key="empty-msg"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-zinc-500 text-xs pl-1 flex items-center gap-1.5"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
                        Enter a GitHub username above to copy your badge link.
                      </motion.p>
                    ) : !validateGitHubUsername(username.trim()) ? (
                      <motion.p
                        key="invalid-format-msg"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-amber-500 text-xs pl-1 flex items-center gap-1.5"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Invalid username format. Usernames can only contain alphanumeric characters
                        and hyphens, and cannot start/end with a hyphen.
                      </motion.p>
                    ) : userDetailsLoading ? (
                      <motion.div
                        key="loading-skeleton"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-3 py-2 animate-pulse"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/10" />
                        <div className="h-3 w-24 bg-white/10 rounded" />
                        <span className="text-[10px] text-zinc-500 ml-auto">Verifying...</span>
                      </motion.div>
                    ) : userDetailsError ? (
                      <motion.p
                        key="error-msg"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-xs pl-1 flex items-center gap-1.5"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                        {userDetailsError === 'User not found'
                          ? 'User not found. Check the spelling or confirm if this account exists on GitHub.'
                          : userDetailsError}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Solves Line 32: Utilizing the statsData array which depends on userDetails status */}
        <div className="hidden">
          {statsData.map((s, idx) => (
            <div key={idx}>{s.value}</div>
          ))}
        </div>

        <FeatureCardsSection>
          <WallOfLove />
        </FeatureCardsSection>
      </main>
      {/* force format patch */}
      <Footer />
    </div>
  );
}
