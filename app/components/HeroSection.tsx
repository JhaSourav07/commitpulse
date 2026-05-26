'use client';

import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <div className="relative text-center mb-16 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_70%)]">
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500 rounded-full" />

      <div className="absolute top-16 left-10 grid grid-cols-6 gap-2 opacity-30">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm bg-green-400 animate-pulse"
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
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Elevate Your <br /> Contribution Story.
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
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
        <div className="px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10 text-green-400 text-sm font-medium">
          ● 1,247 Contributions
        </div>

        <div className="px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-sm font-medium">
          ● 83 Pull Requests
        </div>

        <div className="px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 text-sm font-medium">
          ● 214 Commits
        </div>
      </motion.div>
    </div>
  );
}
