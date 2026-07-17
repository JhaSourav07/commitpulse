'use client';

import { useState } from 'react';
import { Loader2, ExternalLink, Rss } from 'lucide-react';
import { SectionCard, FieldLabel } from '../SectionCard';
import { useDebounce } from '@/hooks/useDebounce';

export interface ArticlesSectionProps {
  showArticles: boolean;
  articlesPlatform: 'devto' | 'hashnode';
  articlesUsername: string;
  onShowArticlesChange: (v: boolean) => void;
  onArticlesPlatformChange: (v: 'devto' | 'hashnode') => void;
  onArticlesUsernameChange: (v: string) => void;
}

export function ArticlesSection({
  showArticles,
  articlesPlatform,
  articlesUsername,
  onShowArticlesChange,
  onArticlesPlatformChange,
  onArticlesUsernameChange,
}: ArticlesSectionProps) {
  const safeUsername = articlesUsername || '';
  const trimmed = safeUsername.trim();
  const debouncedUsername = useDebounce(trimmed, 500);

  const [badgeLoaded, setBadgeLoaded] = useState(false);
  const [badgeError, setBadgeError] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);

  const badgeCount = showArticles && trimmed ? 1 : 0;

  const buildBadgeUrl = () => {
    if (!trimmed) return null;
    const params = new URLSearchParams({
      user: trimmed,
      platform: articlesPlatform,
      // Pass standard theme if needed or let route use default
    });
    return `/api/articles?${params.toString()}`;
  };

  const badgeUrl = buildBadgeUrl();
  const feedUrl =
    articlesPlatform === 'devto' ? `https://dev.to/${trimmed}` : `https://${trimmed}.hashnode.dev/`;

  return (
    <div id="articles-section">
      <SectionCard
        title="Latest Articles"
        description="Display your most recent blog posts dynamically"
        defaultOpen={true}
        badge={badgeCount}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
              Include Latest Articles card
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5 max-w-[280px]">
              Automatically fetch and display your 3 latest articles from Dev.to or Hashnode.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showArticles}
            aria-label="Toggle Latest Articles"
            onClick={() => onShowArticlesChange(!showArticles)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              showArticles ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showArticles ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {showArticles && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onArticlesPlatformChange('devto');
                  setBadgeLoaded(false);
                  setBadgeError(false);
                  setBadgeKey((k) => k + 1);
                }}
                className={`relative px-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  articlesPlatform === 'devto'
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-400'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10'
                }`}
              >
                <Rss size={16} />
                <span className="font-semibold text-sm">Dev.to</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onArticlesPlatformChange('hashnode');
                  setBadgeLoaded(false);
                  setBadgeError(false);
                  setBadgeKey((k) => k + 1);
                }}
                className={`relative px-4 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  articlesPlatform === 'hashnode'
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-400'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10'
                }`}
              >
                <Rss size={16} />
                <span className="font-semibold text-sm">Hashnode</span>
              </button>
            </div>

            <div>
              <FieldLabel htmlFor="articles-username">
                {articlesPlatform === 'hashnode'
                  ? 'Hashnode Username or RSS URL'
                  : 'Dev.to Username'}
              </FieldLabel>
              <div className="relative flex items-center">
                <input
                  id="articles-username"
                  type="text"
                  value={articlesUsername}
                  onChange={(e) => {
                    onArticlesUsernameChange(e.target.value);
                    setBadgeLoaded(false);
                    setBadgeError(false);
                  }}
                  placeholder={
                    articlesPlatform === 'hashnode'
                      ? 'e.g. yourname (or https://myblog.com/rss.xml)'
                      : 'e.g. yourname'
                  }
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
                />
              </div>
            </div>

            {showArticles && debouncedUsername && badgeUrl && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Live Preview</FieldLabel>
                  <a
                    href={feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-500 dark:text-cyan-400 hover:underline"
                  >
                    View blog <ExternalLink size={10} />
                  </a>
                </div>

                <div className="relative rounded-xl border border-gray-200 dark:border-white/8 bg-[#0d1117] p-4 flex items-center justify-center min-h-[160px] overflow-hidden">
                  {!badgeLoaded && !badgeError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-zinc-600" />
                    </div>
                  )}
                  {badgeError && (
                    <p className="text-xs text-red-400 text-center px-4">
                      Could not load articles. Ensure your username is correct and your RSS feed is
                      active.
                    </p>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={`${badgeKey}-${articlesPlatform}-${debouncedUsername}`}
                    src={badgeUrl}
                    alt="Latest Articles"
                    className={`w-full max-w-[400px] transition-opacity duration-500 ${
                      badgeLoaded ? 'opacity-100' : 'opacity-0 absolute'
                    }`}
                    onLoad={() => {
                      setBadgeLoaded(true);
                      setBadgeError(false);
                    }}
                    onError={() => {
                      setBadgeError(true);
                      setBadgeLoaded(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
