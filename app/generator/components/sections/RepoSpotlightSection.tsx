/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { SectionCard, FieldLabel } from '../SectionCard';
import { validateGitHubUsername } from '@/lib/validations';
import { useDebounce } from '@/hooks/useDebounce';

interface Repo {
  name: string;
  description: string | null;
  stargazers_count: number;
}

export interface RepoSpotlightSectionProps {
  githubUsername: string;
  showRepoSpotlight: boolean;
  spotlightRepo: string;
  commitPulseAccent: string;
  onShowRepoSpotlightChange: (v: boolean) => void;
  onSpotlightRepoChange: (v: string) => void;
}

export function RepoSpotlightSection({
  githubUsername,
  showRepoSpotlight,
  spotlightRepo,
  commitPulseAccent,
  onShowRepoSpotlightChange,
  onSpotlightRepoChange,
}: RepoSpotlightSectionProps) {
  const safeUsername = githubUsername || '';
  const trimmed = safeUsername.trim();
  const debouncedUsername = useDebounce(trimmed, 500);
  const safeAccent = commitPulseAccent || '';

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [badgeLoaded, setBadgeLoaded] = useState(false);
  const [badgeError, setBadgeError] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);

  useEffect(() => {
    if (!showRepoSpotlight) return;

    if (!debouncedUsername) {
      setRepos([]);
      setFetchError(null);
      setLoading(false);
      return;
    }

    if (!validateGitHubUsername(debouncedUsername)) {
      setRepos([]);
      setFetchError('Invalid username format');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setFetchError(null);
      setRepos([]);

      try {
        const res = await fetch(
          `/api/user-repos?username=${encodeURIComponent(debouncedUsername)}`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            res.status === 404 ? 'User not found' : (body.error ?? 'Failed to fetch repositories')
          );
        }

        const data = await res.json();
        if (!cancelled && data.repos) {
          setRepos(data.repos);
          if (data.repos.length > 0 && !spotlightRepo) {
            onSpotlightRepoChange(data.repos[0].name);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to fetch repositories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUsername, showRepoSpotlight]);

  const badgeCount = showRepoSpotlight && trimmed && spotlightRepo ? 1 : 0;

  const buildBadgeUrl = () => {
    if (!trimmed || !spotlightRepo) return null;
    const params = new URLSearchParams({ user: trimmed, repo: spotlightRepo });
    const cleaned = safeAccent.replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
      params.set('accent', cleaned);
    }
    return `/api/spotlight?${params.toString()}`;
  };

  const badgeUrl = buildBadgeUrl();

  return (
    <div id="repospotlight-section">
      <SectionCard
        title="Repository Spotlight"
        description="Showcase a specific repository with details and activity graph"
        defaultOpen={true}
        badge={badgeCount}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
              Include repository spotlight in README
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
              Adds a GitHub-styled repository card with participation graph
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showRepoSpotlight}
            aria-label="Toggle Repository Spotlight"
            onClick={() => onShowRepoSpotlightChange(!showRepoSpotlight)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              showRepoSpotlight ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showRepoSpotlight ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {showRepoSpotlight && (
          <div className="flex flex-col gap-4">
            {!trimmed ? (
              <p className="text-xs text-amber-500 dark:text-amber-400">
                Please enter a GitHub username in the CommitPulse Badge section first.
              </p>
            ) : loading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/40">
                <Loader2 size={12} className="animate-spin" />
                Loading repositories...
              </div>
            ) : fetchError ? (
              <p className="text-xs text-red-500 dark:text-red-400">{fetchError}</p>
            ) : repos.length === 0 ? (
              <p className="text-xs text-amber-500 dark:text-amber-400">
                No public repositories found for this user.
              </p>
            ) : (
              <div>
                <FieldLabel htmlFor="spotlight-repo">Select Repository</FieldLabel>
                <div className="relative flex items-center">
                  <select
                    id="spotlight-repo"
                    value={spotlightRepo}
                    onChange={(e) => {
                      onSpotlightRepoChange(e.target.value);
                      setBadgeKey((k) => k + 1);
                      setBadgeLoaded(false);
                      setBadgeError(false);
                    }}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
                  >
                    <option value="" disabled>
                      Select a repository...
                    </option>
                    {repos.map((repo) => (
                      <option key={repo.name} value={repo.name}>
                        {repo.name}{' '}
                        {repo.stargazers_count > 0 ? `(★ ${repo.stargazers_count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showRepoSpotlight && spotlightRepo && badgeUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Live Preview</FieldLabel>
                  <a
                    href={`https://github.com/${trimmed}/${spotlightRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-500 dark:text-cyan-400 hover:underline"
                  >
                    View repository <ExternalLink size={10} />
                  </a>
                </div>

                <div className="relative rounded-xl border border-gray-200 dark:border-white/8 bg-[#0d1117] p-4 flex items-center justify-center min-h-[140px] overflow-hidden">
                  {!badgeLoaded && !badgeError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-zinc-600" />
                    </div>
                  )}
                  {badgeError && (
                    <p className="text-xs text-red-400 text-center px-4">
                      Could not load badge preview. Ensure the repository exists and is public.
                    </p>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={`${badgeKey}-${safeAccent}-${spotlightRepo}`}
                    src={badgeUrl}
                    alt={`Repository Spotlight for ${spotlightRepo}`}
                    className={`w-full max-w-[450px] transition-opacity duration-500 ${
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
