'use client';

import { useTranslation } from '@/context/TranslationContext';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export default function FAQPage() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQItem[] = useMemo(
    () => [
      {
        id: 1,
        question: t('faq.q1', { defaultValue: 'What is CommitPulse?' }),
        answer: t('faq.a1', {
          defaultValue:
            'CommitPulse turns your public GitHub contribution history into customizable SVG badges, dashboards, and 3D-style visualizations for your profile README.',
        }),
        category: 'General',
      },
      {
        id: 2,
        question: t('faq.q2', { defaultValue: 'How does CommitPulse get my GitHub data?' }),
        answer: t('faq.a2', {
          defaultValue:
            'CommitPulse reads public contribution data from GitHub, then renders it as streak stats, heatmaps, comparison views, and shareable badge images.',
        }),
        category: 'How it Works',
      },
      {
        id: 3,
        question: t('faq.q3', { defaultValue: 'Is CommitPulse completely free?' }),
        answer: t('faq.a3', {
          defaultValue:
            'Yes. CommitPulse is free and open source. You can use the hosted badge generator or self-host your own instance.',
        }),
        category: 'Pricing',
      },
      {
        id: 4,
        question: t('faq.q4', { defaultValue: 'Can I customize the badge?' }),
        answer: t('faq.a4', {
          defaultValue:
            'Yes. You can choose themes, colors, views, layout dimensions, grace periods, timezone behavior, and other URL parameters.',
        }),
        category: 'Features',
      },
      {
        id: 5,
        question: t('faq.q5', {
          defaultValue: 'Why does my contribution count differ from GitHub?',
        }),
        answer: t('faq.a5', {
          defaultValue:
            'GitHub and CommitPulse may calculate time boundaries differently. CommitPulse uses UTC-aware caching and supports timezone options to keep streak calculations consistent.',
        }),
        category: 'Features',
      },
      {
        id: 6,
        question: t('faq.q6', { defaultValue: 'Do private contributions count?' }),
        answer: t('faq.a6', {
          defaultValue:
            'Private contributions can only appear when your GitHub profile settings allow private contribution visibility. Otherwise, CommitPulse can only show public activity.',
        }),
        category: 'Privacy',
      },
      {
        id: 7,
        question: t('faq.q7', { defaultValue: 'Can I self-host CommitPulse?' }),
        answer: t('faq.a7', {
          defaultValue:
            'Yes. You can clone the repository, configure the required environment variables, and deploy it on Vercel or another compatible platform.',
        }),
        category: 'Self Hosting',
      },
      {
        id: 8,
        question: t('faq.q8', { defaultValue: 'How can I contribute to the project?' }),
        answer: t('faq.a8', {
          defaultValue:
            'We welcome contributions. Check the GitHub repository for open issues, read the contribution guidelines, and pick a beginner-friendly issue to start.',
        }),
        category: 'Community',
      },
    ],
    [t]
  );

  const filteredFaqs = useMemo(() => {
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqs, searchQuery]);

  const toggleFAQ = (id: number) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 py-12 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* ==================== LEFT COLUMN ==================== */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-24 lg:self-start space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-teal-100 dark:bg-teal-950 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                  Help Center
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-black dark:text-white leading-tight">
                Frequently Asked
                <br />
                <span className="bg-gradient-to-r from-teal-500 to-violet-500 bg-clip-text text-transparent">
                  Questions
                </span>
              </h1>

              <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 max-w-md">
                Find answers to common questions about CommitPulse. Can’t find what you’re looking
                for? Reach out to us.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-teal-500 text-lg placeholder:text-zinc-400"
              />
            </div>

            {/* Quick Links */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm uppercase tracking-widest text-zinc-500 mb-4">
                Still need help?
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/support"
                  className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2"
                >
                  Contact Support
                </a>
                <a
                  href="https://github.com/JhaSourav07/commitpulse"
                  target="_blank"
                  className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-full font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  GitHub Discussions
                </a>
              </div>
            </div>
          </motion.div>

          {/* ==================== RIGHT COLUMN - FAQ Accordion ==================== */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-4"
          >
            <AnimatePresence mode="wait">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-950/50 transition-colors group"
                    >
                      <div className="pr-6 text-lg font-medium text-black dark:text-white">
                        {faq.question}
                      </div>
                      <ChevronDown
                        className={`w-6 h-6 text-zinc-400 group-hover:text-teal-500 transition-all duration-300 ${
                          openIndex === faq.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openIndex === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 pb-8 text-zinc-600 dark:text-zinc-400 leading-relaxed text-[17px]">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 text-zinc-500">No matching questions found.</div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
