'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function CustomizeCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-4xl mx-auto mb-16"
    >
      <div className="group relative rounded-[2rem] border border-white/5 bg-[#0a0a0a] overflow-hidden transition-all duration-700 hover:border-white/10">
        {/* Hover glow layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" />

        {/* Ambient blobs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-10">
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3">
              Customization Studio
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3 leading-snug">
              Want to fine-tune your monolith?
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Dial in every pixel — swap accent colors, try a dark or neon theme, toggle logarithmic
              height scaling, and preview changes live before you paste a single line.
            </p>
          </div>

          <div className="shrink-0">
            <Link href="/customize" id="open-customization-studio-cta">
              <span className="relative inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm text-black bg-white hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200 shadow-[0_0_30px_-4px_rgba(255,255,255,0.25)] cursor-pointer select-none">
                {/* Button shimmer */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-white to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-700"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                </svg>
                Open Customization Studio
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
