import React from 'react';
import { motion } from 'framer-motion';
import { Eye, MessageCircle, Clock, FastForward } from 'lucide-react';
import type { PRInsightData } from '@/services/github/pr-insights';
import { useTranslation } from '@/context/TranslationContext';

export default function ReviewAnalytics({ data }: { data: PRInsightData }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-white dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-3xl p-6 flex flex-col"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.prInsights.reviews_title')}
        </h2>
        <p className="text-sm text-gray-500">{t('dashboard.prInsights.reviews_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-2 text-indigo-500">
            <Eye size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.reviews_given')}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.reviewsGiven}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-2 text-pink-500">
            <MessageCircle size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.reviews_received')}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.reviewsReceived}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-2 text-emerald-500">
            <FastForward size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.fastest_review')}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.fastestReview.toFixed(1)}{' '}
            <span className="text-base text-gray-500 font-medium">
              {t('dashboard.prInsights.hrs')}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 mb-2 text-rose-500">
            <Clock size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {t('dashboard.prInsights.slowest_review')}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.slowestReview.toFixed(1)}{' '}
            <span className="text-base text-gray-500 font-medium">
              {t('dashboard.prInsights.hrs')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
