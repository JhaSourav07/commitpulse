'use client';

// components/dashboard/RecommendationCards.tsx
// Recommendation Cards Component

import { useTranslation } from '@/context/TranslationContext';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  matchScore: number;
  type: 'repository' | 'issue' | 'technology';
}

interface RecommendationCardsProps {
  recommendations: Recommendation[];
}

export default function RecommendationCards({ recommendations }: RecommendationCardsProps) {
  const { t } = useTranslation();

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-default-50 dark:bg-default-900 rounded-lg p-8 text-center">
        <p className="text-default-500">No recommendations found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map((rec) => (
        <article
          key={rec.id}
          className="p-4 bg-default-50 dark:bg-default-900 rounded-lg border border-default-200 dark:border-default-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 capitalize">
              {rec.type}
            </span>
            <span className={`text-sm font-bold ${getMatchColor(rec.matchScore)}`}>
              {rec.matchScore}%
            </span>
          </div>
          <h4 className="font-medium mb-1">{rec.title}</h4>
          <p className="text-sm text-default-600 dark:text-default-400 line-clamp-2">
            {rec.description}
          </p>
          <div className="mt-3 h-2 bg-default-200 dark:bg-default-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${rec.matchScore}%` }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
