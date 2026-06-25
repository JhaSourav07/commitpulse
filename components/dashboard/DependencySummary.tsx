'use client';

// components/dashboard/DependencySummary.tsx
// Dependency Summary Cards

import { useTranslation } from '@/context/TranslationContext';
import type { DependencySummary as DependencySummaryType } from '@/types/dependency';

interface DependencySummaryProps {
  summary: DependencySummaryType;
}

export default function DependencySummary({ summary }: DependencySummaryProps) {
  const { t } = useTranslation();

  const cards = [
    {
      label: t('dashboard.dependency.total'),
      value: summary.total,
      icon: '📦',
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    },
    {
      label: t('dashboard.dependency.direct'),
      value: summary.direct,
      icon: '🔗',
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    },
    {
      label: t('dashboard.dependency.transitive'),
      value: summary.transitive,
      icon: '🔄',
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    },
    {
      label: t('dashboard.dependency.outdated'),
      value: summary.outdated,
      icon: '⏰',
      color:
        summary.outdated > 0
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : '',
    },
    {
      label: t('dashboard.dependency.vulnerable'),
      value: summary.vulnerable,
      icon: '⚠️',
      color:
        summary.vulnerable > 0
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : '',
    },
    {
      label: t('dashboard.dependency.healthy'),
      value: summary.healthy,
      icon: '✅',
      color:
        summary.healthy === summary.total
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <article
          key={index}
          className={`rounded-lg p-4 border ${card.color || 'bg-default-50 dark:bg-default-900 border-default-200 dark:border-default-800'}`}
          role="figure"
          aria-label={`${card.label}: ${card.value}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl" aria-hidden="true">
              {card.icon}
            </span>
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-sm text-default-600 dark:text-default-400">{card.label}</p>
        </article>
      ))}
    </div>
  );
}
