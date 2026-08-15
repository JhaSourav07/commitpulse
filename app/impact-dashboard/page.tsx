'use client';

import { useState } from 'react';
import { Award, Video, Sparkles } from 'lucide-react';
import ValueImpactDashboard from '@/components/dashboard/ValueImpactDashboard';
import RepoReelGenerator from '@/components/dashboard/RepoReelGenerator';
import { useTranslation } from '@/context/TranslationContext';

export default function ImpactDashboardPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'metrics' | 'reporeel'>('metrics');

  const sampleRepositories = [
    {
      name: 'commitpulse',
      commits: 142,
      stars: 48,
      forks: 18,
      pullRequestCount: 22,
      createdAt: '2024-01-10T00:00:00Z',
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      url: 'https://github.com/JhaSourav07/commitpulse',
    },
    {
      name: 'burnout-radar-service',
      commits: 85,
      stars: 24,
      forks: 7,
      pullRequestCount: 12,
      createdAt: '2024-03-15T00:00:00Z',
      primaryLanguage: { name: 'Go', color: '#00ADD8' },
      url: 'https://github.com/JhaSourav07/burnout-radar',
    },
    {
      name: 'reporeel-engine',
      commits: 62,
      stars: 35,
      forks: 11,
      pullRequestCount: 9,
      createdAt: '2024-05-20T00:00:00Z',
      primaryLanguage: { name: 'Python', color: '#3572A5' },
      url: 'https://github.com/JhaSourav07/reporeel-engine',
    },
  ];

  return (
    <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Page Top Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-purple-500" />
              {t('impact_dashboard.page_title')}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t('impact_dashboard.page_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-200/60 dark:bg-neutral-900 border border-gray-300/50 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-300 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{t('impact_dashboard.tab_metrics')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reporeel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reporeel'
                  ? 'bg-white dark:bg-neutral-800 text-purple-600 dark:text-purple-300 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{t('reporeel.tab_studio')}</span>
            </button>
          </div>
        </div>

        {/* Tab View Content */}
        {activeTab === 'metrics' ? (
          <ValueImpactDashboard
            repositories={sampleRepositories}
            onOpenRepoReel={() => setActiveTab('reporeel')}
          />
        ) : (
          <RepoReelGenerator initialRepoUrl="https://github.com/JhaSourav07/commitpulse" />
        )}
      </div>
    </main>
  );
}
