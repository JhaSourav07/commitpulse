'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
};

export function FeatureCard({ icon, title, desc, accent }: FeatureCardProps) {
  const descId = `feature-desc-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const titleId = `feature-title-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      role="article"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="p-10 bg-[#0f0f0f] border border-white/5 rounded-4xl hover:border-white/20 transition-all group"
    >
      <div aria-hidden="true" className={`mb-6 p-3 w-fit rounded-xl bg-white/5 ${accent}`}>
        {icon}
      </div>
      <h3
        id={titleId}
        className="text-xl font-bold mb-3 group-hover:text-emerald-400 transition-colors uppercase tracking-widest max-md:text-sm"
      >
        {title}
      </h3>
      <p id={descId} className="text-gray-500 leading-relaxed font-medium">
        {desc}
      </p>
    </motion.div>
  );
}
