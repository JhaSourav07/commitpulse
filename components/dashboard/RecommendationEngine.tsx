'use client';

// components/dashboard/RecommendationEngine.tsx
// AI Repository Recommendation Engine

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import type { RecommendationData } from '@/types/recommendation';
import RecommendationCards from './RecommendationCards';

interface RecommendationEngineProps {
  username: string;
}

export default function RecommendationEngine({ username }: RecommendationEngineProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'repos' | 'issues' | 'tech'>('repos');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/recommendations?username=${username}`);
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [username]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-label="Loading recommendations">
        <div className="h-8 w-64 bg-default-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-default-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg" role="alert">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <section
      className="space-y-6"
      aria-labelledby="recommendation-engine-title"
    >
      <header>
        <h2
          id="recommendation-engine-title"
          className="text-2xl font-bold text-default"
        >
          {t('dashboard.recommendation.title')}
        </h2>
        <p className="text-default-600 dark:text-default-400 mt-1">
          {t('dashboard.recommendation.subtitle')}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-default-200 dark:border-default-800" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'repos'}
          aria-controls={`panel-${activeTab}`}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'repos'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-default-600 dark:text-default-400 hover:text-default'
          }`}
          onClick={() => setActiveTab('repos')}
        >
          {t('dashboard.recommendation.repositories')} ({data.repositories.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'issues'}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'issues'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-default-600 dark:text-default-400 hover:text-default'
          }`}
          onClick={() => setActiveTab('issues')}
        >
          {t('dashboard.recommendation.issues')} ({data.issues.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'tech'}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'tech'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-default-600 dark:text-default-400 hover:text-default'
          }`}
          onClick={() => setActiveTab('tech')}
        >
          {t('dashboard.recommendation.technologies')} ({data.technologies.length})
        </button>
      </div>

      {/* Content */}
      <div id={`panel-${activeTab}`} role="tabpanel">
        {activeTab === 'repos' && (
          <RecommendationCards
            recommendations={data.repositories.map((r) => ({
              id: r.id,
              title: r.repo.name,
              description: r.reason,
              matchScore: r.matchScore,
              type: 'repository' as const,
            }))}
          />
        )}
        {activeTab === 'issues' && (
          <RecommendationCards
            recommendations={data.issues.map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              matchScore: r.matchScore,
              type: 'issue' as const,
            }))}
          />
        )}
        {activeTab === 'tech' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.technologies.map((tech) => (
              <article
                key={tech.technology}
                className="p-4 bg-default-50 dark:bg-default-900 rounded-lg border border-default-200 dark:border-default-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{tech.technology}</h3>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {tech.score}%
                  </span>
                </div>
                <div className="h-2 bg-default-200 dark:bg-default-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${tech.score}%` }}
                  />
                </div>
                <p className="text-sm text-default-500 mt-2">
                  {tech.usage.join(', ')}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
