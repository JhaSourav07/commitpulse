'use client';

// components/dashboard/ExecutiveInsights.tsx
// Executive Insights Component

import { useTranslation } from '@/context/TranslationContext';
import type { ExecutiveInsight } from '@/types/executive';

interface ExecutiveInsightsProps {
  insights: ExecutiveInsight[];
}

export default function ExecutiveInsights({ insights }: ExecutiveInsightsProps) {
  const { t } = useTranslation();

  const getCategoryColor = (category: ExecutiveInsight['category']) => {
    switch (category) {
      case 'performance':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'risk':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'opportunity':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  const getCategoryIcon = (category: ExecutiveInsight['category']) => {
    switch (category) {
      case 'performance':
        return '📈';
      case 'risk':
        return '⚠️';
      case 'opportunity':
        return '🚀';
    }
  };

  return (
    <section aria-labelledby="executive-insights-title">
      <h3 id="executive-insights-title" className="text-lg font-semibold mb-4">
        {t('dashboard.executive.insights')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className={`p-4 rounded-lg border ${getCategoryColor(insight.category)}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden="true">
                {getCategoryIcon(insight.category)}
              </span>
              <span className="text-sm font-medium capitalize">{insight.category}</span>
            </div>
            <h4 className="font-medium mb-1">{insight.title}</h4>
            <p className="text-sm text-default-600 dark:text-default-400 mb-2">
              {insight.description}
            </p>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                insight.priority === 'high'
                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                  : insight.priority === 'medium'
                  ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {insight.priority} priority
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
