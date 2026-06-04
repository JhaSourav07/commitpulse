'use client';

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
  popularRepos?: Repository[];
  pinnedRepos?: Repository[];
}

export function PopularRepos({ popularRepos, pinnedRepos }: UniversalReposProps) {
  const viewType = 'popular';

  const activeRepos = viewType === 'popular' ? popularRepos : pinnedRepos;

  if ((!popularRepos || popularRepos.length === 0) && (!pinnedRepos || pinnedRepos.length === 0)) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="p-5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
        {/* Header Row */}
        <div className="flex items-center justify-start space-x-2 mb-4">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              style={{ stroke: '#9333ea' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground">Popular Repositories</h3>
        </div>

        {activeRepos?.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No pinned repositories found on this profile.
          </p>
        ) : (
          /* Full-width Stacked Layout (Matching AI Insights Style with Equal Height) */
          <div className="flex flex-col gap-2.5">
            {activeRepos?.slice(0, 3).map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[100px] flex items-start gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-neutral-800/60 bg-gray-50/50 hover:bg-gray-100/80 dark:bg-neutral-900/30 dark:hover:bg-neutral-800/40 transition-all duration-200 group min-w-0 overflow-hidden"
              >
                {/* Content Layout */}
                <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
                  <div className="min-w-0 space-y-0.5">
                    {/* Title row */}
                    <h4 className="font-semibold text-foreground text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      {repo.name}
                    </h4>

                    {/* Tightened description space with layout bounds clipping */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Metadata Indicators Row (Anchored perfectly to card bottom) */}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                    {repo.primaryLanguage && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: repo.primaryLanguage.color }}
                        />
                        <span className="truncate">{repo.primaryLanguage.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 text-zinc-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{repo.stargazerCount}</span>
                    </div>
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
