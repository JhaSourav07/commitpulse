'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Flame,
  Users,
  GitBranch,
  Code2,
  Trophy,
  Sparkles,
  HelpCircle,
  Eye,
  RotateCw,
  Award,
} from 'lucide-react';
import Image from 'next/image';

interface DeveloperArenaProps {
  onSelectBattle: (u1: string, u2: string) => void;
}

// Showdown match-ups
const SHOWDOWNS = [
  {
    u1: 'gaearon',
    u2: 'rich-harris',
    label: 'React vs Svelte',
    desc: 'Framework Pioneers',
    badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
  },
  {
    u1: 'torvalds',
    u2: 'gvanrossum',
    label: 'Kernel vs Python',
    desc: 'Founding Fathers',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
  },
  {
    u1: 'vercel',
    u2: 'netlify',
    label: 'Vercel vs Netlify',
    desc: 'Platform Wars',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
  },
  {
    u1: 'yyx990803',
    u2: 'antfu',
    label: 'Vue vs Nuxt/Vite',
    desc: 'Vite Ecosystem',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
  },
  {
    u1: 'dhh',
    u2: 'taylorotwell',
    label: 'Ruby vs PHP',
    desc: 'Backend Monoliths',
    badgeColor: 'border-red-500/30 text-red-400 bg-red-500/5',
  },
  {
    u1: 'shadcn',
    u2: 'pacocoursey',
    label: 'shadcn vs paco',
    desc: 'Design Wizards',
    badgeColor: 'border-pink-500/30 text-pink-400 bg-pink-500/5',
  },
];

// Legends for the carousel
const LEGENDS = [
  {
    username: 'torvalds',
    name: 'Linus Torvalds',
    title: 'Creator of Linux & Git',
    stars: '190k',
    followers: '200k',
    repos: '7',
    lang: 'C',
  },
  {
    username: 'gaearon',
    name: 'Dan Abramov',
    title: 'React Core / Redux Creator',
    stars: '8k',
    followers: '100k',
    repos: '280',
    lang: 'JavaScript',
  },
  {
    username: 'yyx990803',
    name: 'Evan You',
    title: 'Vue.js & Vite Creator',
    stars: '12k',
    followers: '140k',
    repos: '185',
    lang: 'TypeScript',
  },
  {
    username: 'rich-harris',
    name: 'Rich Harris',
    title: 'Svelte & Rollup Creator',
    stars: '6k',
    followers: '40k',
    repos: '312',
    lang: 'JavaScript',
  },
  {
    username: 'antfu',
    name: 'Anthony Fu',
    title: 'Vite / Vitest Core Member',
    stars: '5k',
    followers: '45k',
    repos: '810',
    lang: 'TypeScript',
  },
  {
    username: 'sindresorhus',
    name: 'Sindre Sorhus',
    title: '1000+ NPM Packages',
    stars: '23k',
    followers: '50k',
    repos: '1200',
    lang: 'JavaScript',
  },
  {
    username: 'taylorotwell',
    name: 'Taylor Otwell',
    title: 'Laravel Creator',
    stars: '6k',
    followers: '35k',
    repos: '25',
    lang: 'PHP',
  },
  {
    username: 'dhh',
    name: 'David Heinemeier H.',
    title: 'Ruby on Rails Creator',
    stars: '4k',
    followers: '28k',
    repos: '12',
    lang: 'Ruby',
  },
];

// Guess game challenges
const GAME_CHALLENGES = [
  {
    stats: [
      '⭐ 100k+ followers',
      '📦 Creator of Redux & React Core alumnus',
      '💻 Primary: JavaScript',
    ],
    username: 'gaearon',
    name: 'Dan Abramov',
    bio: 'React core team alumnus, creator of Redux and Create React App.',
  },
  {
    stats: [
      '⭐ 140k+ followers',
      '📦 Creator of Vue.js & Vite dev server',
      '💻 Primary: JavaScript / TypeScript',
    ],
    username: 'yyx990803',
    name: 'Evan You',
    bio: 'Independent open-source developer, creator of Vue.js, Vite, and Rolldown.',
  },
  {
    stats: ['⭐ 200k+ followers', '📦 Creator of Linux Kernel & Git VCS', '💻 Primary: C'],
    username: 'torvalds',
    name: 'Linus Torvalds',
    bio: 'Founding father of the Linux kernel and the Git version control system.',
  },
  {
    stats: [
      '⭐ 80k+ followers',
      '📦 Founder/CEO of Vercel & creator of Socket.io',
      '💻 Primary: JavaScript / TypeScript',
    ],
    username: 'rauchg',
    name: 'Guillermo Rauch',
    bio: 'Founder and CEO of Vercel, creator of Next.js, Socket.io, and Mongoose.',
  },
  {
    stats: [
      '⭐ 40k+ followers',
      '📦 Creator of Svelte UI Framework & Rollup packager',
      '💻 Primary: JavaScript',
    ],
    username: 'rich-harris',
    name: 'Rich Harris',
    bio: 'Creator of Svelte and Rollup, developer relations engineer at Vercel.',
  },
  {
    stats: [
      '⭐ 50k+ followers',
      '📦 Prolific developer (maintains 1000+ NPM packages)',
      '💻 Primary: JavaScript / Swift',
    ],
    username: 'sindresorhus',
    name: 'Sindre Sorhus',
    bio: 'Full-time open-source developer maintaining thousands of npm packages.',
  },
  {
    stats: [
      '⭐ 45k+ followers',
      '📦 Prolific Core contributor to Vue, Vite, and Nuxt',
      '💻 Primary: TypeScript',
    ],
    username: 'antfu',
    name: 'Anthony Fu',
    bio: 'Core team member of Vite and Vue, creator of Vitest, Nuxt Labs developer.',
  },
];

// Predictions data
const PREDICTIONS = [
  {
    title: 'Frontend Champion',
    match: 'gaearon vs rich-harris',
    desc: 'rich-harris is predicted to dominate on compilation efficiency with Svelte, while gaearon holds the React community crown!',
    u1: 'gaearon',
    u2: 'rich-harris',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    title: 'Open Source King',
    match: 'torvalds vs gvanrossum',
    desc: "torvalds commands a legendary 200k+ star power, but gvanrossum's Python legacy shapes the AI era. It's an epic clash!",
    u1: 'torvalds',
    u2: 'gvanrossum',
    accent: 'from-purple-400 to-indigo-500',
  },
  {
    title: 'Fastest Growing Developer',
    match: 'antfu vs leerob',
    desc: "antfu's prolific release rate of Vite and Vue utilities is outputting code at an inhuman pace. A rising giant of the web!",
    u1: 'antfu',
    u2: 'leerob',
    accent: 'from-emerald-400 to-teal-500',
  },
  {
    title: 'Most Consistent Contributor',
    match: 'sindresorhus vs shadcn',
    desc: "sindresorhus's green contribution board has been solid for a decade. The absolute king of open-source consistency.",
    u1: 'sindresorhus',
    u2: 'shadcn',
    accent: 'from-amber-400 to-orange-500',
  },
];

// CountUp counter subcomponent
function CountUp({ to, duration = 1800 }: { to: number; duration?: number }) {
  const supportsObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  const [count, setCount] = useState(() => (supportsObserver ? 0 : to));
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(!supportsObserver);

  useEffect(() => {
    if (!supportsObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const end = to;
          const totalMiliseconds = duration;
          const incrementTime = Math.max(Math.floor(totalMiliseconds / 60), 10);
          const steps = totalMiliseconds / incrementTime;
          const increment = Math.ceil(end / steps);

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              clearInterval(timer);
              setCount(end);
            } else {
              setCount(start);
            }
          }, incrementTime);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [to, duration, supportsObserver]);

  return <span ref={elementRef}>{count.toLocaleString()}</span>;
}

export default function DeveloperArena({ onSelectBattle }: DeveloperArenaProps) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse move handler for premium spotlight follow effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Guess the Developer Game states
  const [gameIdx, setGameIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isGameHovered, setIsGameHovered] = useState(false);

  useEffect(() => {
    if (revealed || isGameHovered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Trigger next challenge
          setGameIdx((prevIdx) => (prevIdx + 1) % GAME_CHALLENGES.length);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [revealed, isGameHovered]);

  const handleNextGame = () => {
    setRevealed(false);
    setGameIdx((prev) => (prev + 1) % GAME_CHALLENGES.length);
    setTimeLeft(10);
  };

  // AI Predictions rotation state
  const [predIdx, setPredIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPredIdx((prev) => (prev + 1) % PREDICTIONS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const currentChallenge = GAME_CHALLENGES[gameIdx];
  const currentPrediction = PREDICTIONS[predIdx];

  return (
    <div
      ref={arenaRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full rounded-3xl border border-black/10 dark:border-white/5 bg-zinc-950/40 backdrop-blur-xl p-6 md:p-10 overflow-hidden"
    >
      {/* Self-contained CSS Marquee styling */}
      <style>{`
        @keyframes marquee-arena {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track-showdowns {
          display: flex;
          width: max-content;
          animation: marquee-arena 35s linear infinite;
        }
        .marquee-track-showdowns:hover {
          animation-play-state: paused;
        }
        .marquee-track-legends {
          display: flex;
          width: max-content;
          animation: marquee-arena 45s linear infinite;
        }
        .marquee-track-legends:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Spotlight cursor tracking overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.08), rgba(139, 92, 246, 0.08), transparent 60%)`,
        }}
      />

      {/* Ambient floating radial lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-semibold uppercase tracking-widest">
            <Sparkles size={12} className="animate-pulse" />
            Developer Battleground
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Step Into the Esports Arena
          </h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Select a trending showdown, test your open-source trivia skills, or look up predictions
            before starting your custom battle.
          </p>
        </div>

        {/* 1. Trending Developer Showdowns */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
                Trending Showdowns
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">click to battle</span>
          </div>

          <div className="w-full overflow-hidden relative py-2">
            {/* Fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950 via-zinc-950/70 to-transparent z-10 pointer-events-none" />

            <div className="marquee-track-showdowns gap-4">
              {/* Double mapping for infinite marquee loop */}
              {[...SHOWDOWNS, ...SHOWDOWNS].map((match, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => onSelectBattle(match.u1, match.u2)}
                  className="w-72 bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/5 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between select-none relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono text-zinc-500">{match.desc}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${match.badgeColor}`}
                    >
                      HOT
                    </span>
                  </div>
                  <div className="flex justify-center items-center gap-3 py-2">
                    <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                      @{match.u1}
                    </span>
                    <span className="text-xs font-black text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      VS
                    </span>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                      @{match.u2}
                    </span>
                  </div>
                  <div className="border-t border-white/5 mt-3 pt-2 text-center text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    {match.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows Grid: Guess Game & AI Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2. Guess The Developer Game */}
          <div
            onMouseEnter={() => setIsGameHovered(true)}
            onMouseLeave={() => setIsGameHovered(false)}
            className="flex flex-col justify-between bg-zinc-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                  Guess The Developer
                </h3>
              </div>
              {!revealed && (
                <div className="text-[10px] font-mono text-cyan-400/80 bg-cyan-400/5 px-2 py-0.5 rounded-full border border-cyan-400/20">
                  Autoplays in {timeLeft}s
                </div>
              )}
            </div>

            {/* Content card */}
            <div className="flex-1 min-h-[160px] flex flex-col justify-center relative z-10">
              <AnimatePresence mode="wait">
                {!revealed ? (
                  <motion.div
                    key={`hint-${gameIdx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-zinc-400 font-mono">ANONYMOUS STATS:</p>
                    <div className="space-y-2">
                      {currentChallenge.stats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-200">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                          <span>{stat}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`reveal-${gameIdx}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <Image
                        src={`https://github.com/${currentChallenge.username}.png`}
                        alt={currentChallenge.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">{currentChallenge.name}</h4>
                      <p className="text-xs text-cyan-400">@{currentChallenge.username}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                        {currentChallenge.bio}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Timer Progress Bar */}
            {!revealed && (
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-6 mb-2">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / 10) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className={`flex items-center gap-3 mt-6 pt-4 border-t border-white/5`}>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Eye size={14} /> Reveal Developer
                </button>
              ) : (
                <button
                  onClick={() => onSelectBattle(currentChallenge.username, 'torvalds')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <Swords size={14} /> Challenge Linus!
                </button>
              )}
              <button
                onClick={handleNextGame}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-xs font-bold transition-colors bg-white/5"
              >
                Skip
              </button>
            </div>
          </div>

          {/* 3. AI Predictions Panel */}
          <div className="flex flex-col justify-between bg-zinc-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            {/* Cyberpunk Grid/Scanning overlay */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-60 shadow-[0_0_10px_2px_rgba(168,85,247,0.4)] animate-[scan_6s_ease-in-out_infinite]" />
            <style>{`
              @keyframes scan {
                0% { transform: translateY(0); }
                50% { transform: translateY(240px); }
                100% { transform: translateY(0); }
              }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                  AI Showdown Predictions
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                <span className="text-[9px] font-mono text-purple-400 tracking-wider">
                  LIVE DATA
                </span>
              </div>
            </div>

            {/* Prediction details */}
            <div className="flex-1 min-h-[160px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={predIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase font-mono">
                      CAT:
                    </span>
                    <span className="text-xs font-extrabold text-white tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-800">
                      {currentPrediction.title}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                    <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                      @{currentPrediction.u1}
                    </span>
                    <span className="text-zinc-600 text-xs font-bold">vs</span>
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      @{currentPrediction.u2}
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal bg-zinc-950/40 border border-white/5 rounded-xl p-3">
                    {currentPrediction.desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => onSelectBattle(currentPrediction.u1, currentPrediction.u2)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-purple-500/30 text-white text-xs font-bold hover:border-purple-500/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
              >
                <Swords size={12} className="text-purple-400" /> Start Predicted Battle
              </button>
              <button
                onClick={() => setPredIdx((prev) => (prev + 1) % PREDICTIONS.length)}
                className="px-3 py-2.5 rounded-xl border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Next Prediction"
                aria-label="Next Prediction"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Global GitHub Stats */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { to: 142580, label: 'Developers Compared', icon: Users, color: 'text-cyan-400' },
              { to: 894204, label: 'Repos Analyzed', icon: GitBranch, color: 'text-purple-400' },
              { to: 147, label: 'Languages Tracked', icon: Code2, color: 'text-emerald-400' },
              { to: 3412, label: 'Comparisons Today', icon: Flame, color: 'text-amber-400' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="space-y-2 relative group">
                  <div className="flex justify-center mb-1">
                    <Icon
                      size={18}
                      className={`${stat.color} opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}
                    />
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
                    <CountUp to={stat.to} />
                    {stat.to > 1000 && '+'}
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. GitHub Legends Carousel */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-400 animate-bounce" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
                GitHub Legends Walk of Fame
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">hover to pause</span>
          </div>

          <div className="w-full overflow-hidden relative py-2">
            {/* Fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-zinc-950 via-zinc-950/70 to-transparent z-10 pointer-events-none" />

            <div className="marquee-track-legends gap-4">
              {/* Double mapping for infinite marquee loop */}
              {[...LEGENDS, ...LEGENDS].map((legend, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4, border: '1px solid rgba(245, 158, 11, 0.4)' }}
                  onClick={() => onSelectBattle(legend.username, 'gaearon')}
                  className="w-80 bg-zinc-900/50 hover:bg-zinc-900/80 border border-white/5 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex items-center justify-between gap-4 select-none relative group"
                >
                  <div className="absolute top-2 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Award size={12} className="text-amber-400" />
                    <span className="text-[8px] font-bold text-amber-400 font-mono">CHALLENGE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-zinc-800 shrink-0">
                      <Image
                        src={`https://github.com/${legend.username}.png`}
                        alt={legend.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors">
                        {legend.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500">@{legend.username}</p>
                      <p className="text-[9px] text-zinc-400 font-medium leading-normal line-clamp-1">
                        {legend.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 border-l border-white/5 pl-3">
                    <span className="text-[10px] font-bold text-white">{legend.followers}</span>
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Followers
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5 mt-1 font-mono font-bold">
                      {legend.lang}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
