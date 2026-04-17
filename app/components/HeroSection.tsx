'use client';

import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <div className="text-center mb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
          Elevate Your <br /> Contribution Story.
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
      >
        Stop settling for flat grids. Generate high-fidelity, 3D isometric monoliths that
        visualize your coding rhythm with professional precision.
      </motion.p>
    </div>
  );
}