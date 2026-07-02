'use client';

import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function ScrollToBottom() {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.2,
  });

  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  // Inverted: full ring at top, empty at bottom
  const strokeDashoffset = useTransform(smoothScrollProgress, [0, 1], [0, circumference]);

  useEffect(() => {
    const updateVisibility = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      setIsVisible(scrolled < total - 40);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 sm:bottom-8"
        >
          <motion.button
            type="button"
            onClick={scrollToBottom}
            whileHover={shouldReduceMotion ? undefined : { y: 2 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            aria-label="Scroll to bottom"
            className="
              group relative flex h-14 w-14 items-center justify-center rounded-full
              border border-violet-400/45 bg-zinc-950/80 text-violet-300
              shadow-[0_0_24px_rgba(167,139,250,0.16)]
              backdrop-blur-md transition-all duration-200
              hover:border-violet-300 hover:bg-violet-950/35 hover:text-violet-200
              hover:shadow-[0_0_28px_rgba(167,139,250,0.28)]\
              active:translate-y-0
              focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-4 focus-visible:outline-violet-400
            "
          >
            {!shouldReduceMotion && (
              <span className="absolute inset-0 rounded-full border border-violet-400/35 opacity-70 animate-ping" />
            )}

            <svg
              aria-hidden="true"
              width="58"
              height="58"
              viewBox="0 0 58 58"
              className="absolute -rotate-90"
            >
              <circle
                cx="29"
                cy="29"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-violet-400/15"
              />
              <motion.circle
                cx="29"
                cy="29"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset }}
                className="text-violet-300"
              />
            </svg>

            <motion.span
              aria-hidden="true"
              animate={shouldReduceMotion ? undefined : { y: [0, 3, 0] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative z-10"
            >
              <ChevronDown
                size={23}
                strokeWidth={2.4}
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              />
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
