'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GitFork, Search } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

// 3D Glare Card Component
function GlareCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={className}
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '50%',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export default function ContributorsSearch({ contributors }: { contributors: Contributor[] }) {
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = contributors.filter((c) => c.login.toLowerCase().includes(normalizedSearch));

  return (
    <>
      {/* SEARCH BAR */}
      <div className="mx-auto mb-16 max-w-2xl" id="contributors">
        <div className="relative group">
          {/* Animated gradient border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-30 blur-sm group-focus-within:opacity-70 transition-opacity duration-500" />
          <div className="relative flex items-center rounded-2xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10">
            <Search className="ml-5 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search the collective..."
              aria-label="Search contributors by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent px-4 py-5 text-lg text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none font-light"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mr-4 text-zinc-500 hover:text-black dark:hover:text-white transition-colors text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 text-center text-sm text-zinc-600">
          {filtered.length} of {contributors.length} contributors
        </div>
      </div>

      {/* NO RESULTS */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="text-6xl mb-6">🔍</div>
            <p className="text-2xl font-bold text-black dark:text-white">No architects found</p>
            <p className="mt-3 text-zinc-500 text-lg">Try a different search query</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={normalizedSearch}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence>
          {filtered.map((contributor) => (
            <motion.div
              key={contributor.id}
              variants={itemVariants}
              layout
              initial="hidden"
              animate="visible"
              exit="exit"
              className="group relative h-full"
            >
              <GlareCard className="h-full">
                <Link
                  href={contributor.html_url}
                  target="_blank"
                  className="block h-full relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                >
                  {/* Mouse-following radial glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{
                      background:
                        'radial-gradient(300px circle at var(--mouse-x) var(--mouse-y), rgba(34,211,238,0.08), transparent 60%)',
                    }}
                  />

                  {/* Top accent line */}
                  <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10 flex flex-col items-center text-center h-full">
                    {/* AVATAR */}
                    <div className="relative mb-5">
                      <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-[2]" />
                      <Image
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        width={90}
                        height={90}
                        className="relative rounded-full border-2 border-black/10 dark:border-white/10 transition-all duration-500 group-hover:border-cyan-500/50 dark:group-hover:border-cyan-400/50 group-hover:scale-105"
                      />
                      {/* Online indicator */}
                      <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h3 className="text-lg font-bold text-black dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors duration-300 truncate w-full">
                      {contributor.login}
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      <span className="text-sm font-mono font-semibold text-cyan-400/80">
                        {contributor.contributions}
                      </span>
                      <span className="text-xs">commits</span>
                    </div>

                    <div className="flex-grow" />

                    <div className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-all duration-300 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                      <GitFork className="h-4 w-4" />
                      View Profile
                    </div>
                  </div>
                </Link>
              </GlareCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
