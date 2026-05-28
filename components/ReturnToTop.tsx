'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ReturnToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user is near the bottom of the page
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      // Show when user is within 300px of the bottom
      if (scrollHeight - (scrollTop + clientHeight) < 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full border border-emerald-500/20 bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 dark:border-emerald-400/20 dark:bg-black dark:text-emerald-400 dark:hover:bg-emerald-400 dark:hover:text-black dark:hover:border-emerald-400 hover:scale-110 active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.15)] dark:shadow-[0_4px_30px_rgba(16,185,129,0.3)] transition-all duration-300 z-50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffaa] focus-visible:ring-offset-2"
          aria-label="Return to top"
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
