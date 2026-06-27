'use client';

import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';

export function HeroSection() {
  return (
    <div
      role="region"
      aria-label="Hero section"
      className="relative text-center mb-16 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.04),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_70%)] transition-colors duration-300"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 dark:opacity-10 bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 blur-3xl opacity-10 dark:opacity-20 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 rounded-full"
      />

      <div
        aria-hidden="true"
        className="absolute top-16 left-10 grid grid-cols-6 gap-2 opacity-50 dark:opacity-30"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm bg-green-500 dark:bg-green-400 animate-pulse"
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-600 dark:from-green-400 dark:via-cyan-400 dark:to-purple-500 bg-clip-text text-transparent">
          Elevate Your <br /> Contribution Story.
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative text-gray-600 dark:text-white/65 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
      >
        Stop settling for flat grids. Generate high-fidelity, 3D isometric monoliths that visualize
        your coding rhythm with professional precision.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <div className="px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium">
          ● 1,247 Contributions
        </div>

        <div className="px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-sm font-medium">
          ● 83 Pull Requests
        </div>

        <div className="px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-sm font-medium">
          ● 214 Commits
        </div>
      </motion.div>

      {/* Fully Configured Light/Dark Mode Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        role="search"
        aria-label="Generate your GitHub streak badge"
        className="relative mt-12 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl border border-gray-200 bg-white/70 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-none"
      >
        <input
          type="text"
          placeholder="Enter GitHub Username"
          aria-label="GitHub username"
          className="flex-1 w-full bg-transparent border-none px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-white/60"
        />
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium transition hover:bg-gray-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
          <Copy size={18} />
          Copy Link
        </button>
        <button className="px-6 py-3 rounded-xl bg-[#5C45FD] text-white font-medium shadow-lg shadow-[#5C45FD]/30 transition hover:bg-[#4a35da] hover:shadow-[#5C45FD]/50">
          Watch Dashboard
        </button>
      </motion.div>
    </div>
  );
}
