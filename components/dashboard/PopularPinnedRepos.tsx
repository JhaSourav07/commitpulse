'use client';

import React, { useState } from 'react';

interface Repository {
  name: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  url: string;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
}

interface UniversalReposProps {
  popularRepos: Repository[];
  pinnedRepos: Repository[];
}

export function PopularRepos({ popularRepos, pinnedRepos }: UniversalReposProps) {
  const [viewType, setViewType] = useState<'popular' | 'pinned'>('popular');

  const activeRepos = viewType === 'popular' ? popularRepos : pinnedRepos;

  if ((!popularRepos || popularRepos.length === 0) && (!pinnedRepos || pinnedRepos.length === 0)) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="p-5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
        {/* Header and Dropdown Row */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {viewType === 'popular' ? 'Popular Repositories' : 'Pinned Repositories'}
          </h3>

          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as 'popular' | 'pinned')}
            className="text-xs font-semibold bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-foreground cursor-pointer outline-none hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <option value="popular">Most Popular</option>
            {pinnedRepos.length > 0 && <option value="pinned">Pinned Work</option>}
          </select>
        </div>

        {activeRepos.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No pinned repositories found on this profile.
          </p>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-4 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-neutral-900 dark:hover:bg-neutral-800/80 transition-colors duration-200 group min-w-0 h-[140px]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg
                      className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <h4 className="font-semibold text-foreground text-sm truncate">{repo.name}</h4>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {repo.description || 'No description provided.'}
                  </p>
                </div>

                {/* Bottom stats row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-gray-200/60 dark:border-neutral-800 min-w-0">
                  {/* Language wrapper */}
                  {repo.primaryLanguage ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: repo.primaryLanguage.color }}
                      />
                      <span className="truncate whitespace-nowrap text-[11px]">
                        {repo.primaryLanguage.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-foreground/70"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{repo.stargazerCount}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
