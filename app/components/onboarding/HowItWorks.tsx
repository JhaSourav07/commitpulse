'use client';

import { motion } from 'framer-motion';
import { HOW_IT_WORKS_STEPS } from './constants';

export function HowItWorks() {
  return (
    <section className="w-full max-w-3xl" data-testid="how-it-works">
      <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-white/45">
        How It Works
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {HOW_IT_WORKS_STEPS.map((item, index) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * index, duration: 0.4 }}
            className="rounded-2xl border border-black/5 bg-white/60 p-4 text-center dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {item.step}
            </span>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/55">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
