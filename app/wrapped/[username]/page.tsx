'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  Flame,
  Trophy,
  GitCommit,
  Calendar,
  Share2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { CommitPulseLogo } from '@/components/commitpulse-logo';
import BrandParticles from '@/components/BrandParticles';

interface WrappedData {
  profile: {
    login: string;
    name: string | null;
    avatar_url: string;
  };
  wrappedStats: {
    totalContributions: number;
    mostActiveDate: string;
    highestDailyCount: number;
    busiestMonth: string;
    weekendRatio: number;
  };
}

const SLIDES_COUNT = 6;

export default function WrappedPage() {
  const { username } = useParams();
  const router = useRouter();
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/wrapped?username=${username}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch');
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  const paginate = (newDirection: number) => {
    if (currentSlide + newDirection >= 0 && currentSlide + newDirection < SLIDES_COUNT) {
      setDirection(newDirection);
      setCurrentSlide(currentSlide + newDirection);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-500 animate-pulse uppercase tracking-[0.2em] text-xs font-bold">
          Compiling your monolith...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6 font-sans">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-zinc-500 mb-8 text-center max-w-md">
          {error || 'Could not load your wrapped data.'}
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const { profile, wrappedStats } = data;
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const busiestMonthName =
    wrappedStats.busiestMonth !== 'N/A'
      ? monthNames[parseInt(wrappedStats.busiestMonth.split('-')[1]) - 1]
      : 'N/A';

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative selection:bg-emerald-500/30">
      <BrandParticles />

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
            <CommitPulseLogo className="w-5 h-5" />
          </div>
          <span className="font-black tracking-tighter text-xl hidden sm:inline-block">
            CommitPulse
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
            Slide {currentSlide + 1} / {SLIDES_COUNT}
          </div>
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[60] flex gap-1 px-1 py-1">
        {[...Array(SLIDES_COUNT)].map((_, i) => (
          <div key={i} className="flex-1 h-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: i < currentSlide ? '100%' : i === currentSlide ? '100%' : '0%' }}
              transition={{ duration: i === currentSlide ? 0.5 : 0.2 }}
            />
          </div>
        ))}
      </div>

      <main className="h-screen flex items-center justify-center relative z-10">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full max-w-4xl px-6 flex flex-col items-center text-center"
          >
            {/* Slide 0: Intro */}
            {currentSlide === 0 && (
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-emerald-500/20 mb-8 shadow-2xl shadow-emerald-500/20"
                >
                  <img
                    src={profile.avatar_url}
                    alt={profile.login}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-zinc-500 uppercase tracking-[0.3em] font-black text-sm mb-4"
                >
                  The coding monolith of
                </motion.h2>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent"
                >
                  {profile.name || profile.login}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-zinc-400 max-w-md leading-relaxed"
                >
                  Every commit is a brick in your skyscraper. <br />
                  Every day is a floor in your legacy.
                </motion.p>
              </div>
            )}

            {/* Slide 1: Total Contributions */}
            {currentSlide === 1 && (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-10 text-emerald-500 shadow-inner">
                  <GitCommit size={48} />
                </div>
                <h2 className="text-zinc-500 uppercase tracking-[0.3em] font-black text-sm mb-4">
                  Total Output
                </h2>
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-8xl md:text-[12rem] font-black tracking-tighter text-emerald-500 leading-none">
                    {wrappedStats.totalContributions}
                  </span>
                </div>
                <p className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-2">
                  Commits Shipped
                </p>
                <p className="text-zinc-500">Across your public contribution history.</p>
              </div>
            )}

            {/* Slide 2: Peak Day */}
            {currentSlide === 2 && (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-10 text-orange-500">
                  <Flame size={48} />
                </div>
                <h2 className="text-zinc-500 uppercase tracking-[0.3em] font-black text-sm mb-4">
                  The Absolute Peak
                </h2>
                <div className="text-4xl md:text-6xl font-black mb-8">
                  <span className="text-orange-500">{wrappedStats.highestDailyCount}</span> COMMITS
                </div>
                <p className="text-xl md:text-2xl text-zinc-300 max-w-sm">
                  On{' '}
                  <span className="text-white font-bold">
                    {new Date(wrappedStats.mostActiveDate).toLocaleDateString(undefined, {
                      dateStyle: 'long',
                    })}
                  </span>
                  , you were unstoppable.
                </p>
              </div>
            )}

            {/* Slide 3: Weekend/Weekday */}
            {currentSlide === 3 && (
              <div className="flex flex-col items-center w-full">
                <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-10 text-blue-500">
                  <Calendar size={48} />
                </div>
                <h2 className="text-zinc-500 uppercase tracking-[0.3em] font-black text-sm mb-8">
                  Your Grind DNA
                </h2>

                <div className="w-full max-w-md bg-white/5 rounded-3xl p-8 border border-white/5">
                  <div className="flex justify-between items-end mb-4">
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                        Weekday
                      </p>
                      <p className="text-3xl font-black">{100 - wrappedStats.weekendRatio}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                        Weekend
                      </p>
                      <p className="text-3xl font-black text-blue-500">
                        {wrappedStats.weekendRatio}%
                      </p>
                    </div>
                  </div>
                  <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${100 - wrappedStats.weekendRatio}%` }}
                    />
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${wrappedStats.weekendRatio}%` }}
                    />
                  </div>
                  <p className="mt-8 text-zinc-400">
                    {wrappedStats.weekendRatio > 30
                      ? "You're a true Weekend Warrior, building while others rest."
                      : 'Consistency is your middle name. You own the work week.'}
                  </p>
                </div>
              </div>
            )}

            {/* Slide 4: Busiest Month */}
            {currentSlide === 4 && (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-10 text-purple-500">
                  <Trophy size={48} />
                </div>
                <h2 className="text-zinc-500 uppercase tracking-[0.3em] font-black text-sm mb-4">
                  The Most Productive
                </h2>
                <div className="text-6xl md:text-9xl font-black text-purple-500 tracking-tighter mb-4">
                  {busiestMonthName.toUpperCase()}
                </div>
                <p className="text-xl md:text-2xl text-zinc-300">
                  This month was a masterpiece of productivity.
                </p>
              </div>
            )}

            {/* Slide 5: Summary Card */}
            {currentSlide === 5 && (
              <div className="flex flex-col items-center w-full">
                <div className="relative group p-1 rounded-[3rem] bg-gradient-to-br from-emerald-500 via-cyan-500 to-purple-500 shadow-2xl shadow-emerald-500/20">
                  <div className="bg-[#0a0a0a] rounded-[2.8rem] p-8 md:p-12 w-full max-w-sm md:max-w-md text-left relative overflow-hidden">
                    {/* Card background accents */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />

                    <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
                      <img
                        src={profile.avatar_url}
                        className="w-12 h-12 rounded-xl border border-white/10"
                        alt=""
                      />
                      <div>
                        <h3 className="font-bold text-lg leading-none mb-1">
                          {profile.name || profile.login}
                        </h3>
                        <p className="text-zinc-500 text-xs tracking-wider">@{profile.login}</p>
                      </div>
                      <div className="ml-auto">
                        <CommitPulseLogo className="w-6 h-6 text-emerald-500" />
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
                          Total Output
                        </span>
                        <span className="text-2xl font-black text-emerald-500">
                          {wrappedStats.totalContributions}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
                          Peak Action
                        </span>
                        <span className="text-xl font-black">
                          {wrappedStats.highestDailyCount} Commits
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
                          Top Month
                        </span>
                        <span className="text-xl font-black text-purple-500">
                          {busiestMonthName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
                          Weekend Ratio
                        </span>
                        <span className="text-xl font-black text-blue-500">
                          {wrappedStats.weekendRatio}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-[0.3em]">
                        CommitPulse Wrapped
                      </span>
                      <span className="text-[9px] text-zinc-700">
                        {new Date().getFullYear()} RECAP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-12">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/wrapped/${username}`
                      );
                      alert('Link copied to clipboard!');
                    }}
                    className="flex items-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-2xl font-bold hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
                  >
                    <Share2 size={18} />
                    Share Journey
                  </button>
                  <Link
                    href="/"
                    className="flex items-center gap-2 bg-white/5 text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5"
                  >
                    Done
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Buttons */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center items-center gap-12 z-50">
        <button
          onClick={() => paginate(-1)}
          disabled={currentSlide === 0}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${currentSlide === 0 ? 'opacity-0 scale-50' : 'bg-white/10 hover:bg-white/20 active:scale-90 border border-white/10'}`}
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => paginate(1)}
          disabled={currentSlide === SLIDES_COUNT - 1}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${currentSlide === SLIDES_COUNT - 1 ? 'opacity-0 scale-50' : 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-90 shadow-xl shadow-emerald-500/20'}`}
        >
          <ArrowRight size={24} />
        </button>
      </div>

      <div className="fixed bottom-4 left-0 right-0 text-center opacity-30 text-[10px] tracking-[0.4em] uppercase pointer-events-none">
        Use Arrows to Navigate
      </div>
    </div>
  );
}
