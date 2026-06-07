'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Loader2, Search, X, ExternalLink } from 'lucide-react';

import { SectionCard, FieldLabel } from '../SectionCard';
import { validateGitHubUsername } from '@/lib/validations';
import { useDebounce } from '@/hooks/useDebounce';

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalContributions: number;
}

interface UserDetails {
  exists: boolean;
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  stats: UserStats;
}

export interface CommitPulseSectionProps {
  githubUsername: string;
  showCommitPulse: boolean;
  commitPulseAccent: string;
  onGithubUsernameChange: (v: string) => void;
  onShowCommitPulseChange: (v: boolean) => void;
  onCommitPulseAccentChange: (v: string) => void;
}

const BADGE_BASE = 'https://commitpulse.vercel.app/api/streak';
const DASHBOARD_BASE = 'https://commitpulse.vercel.app/dashboard';

function buildBadgeUrl(username: string, accent: string): string {
  const params = new URLSearchParams({ user: username });
  const cleaned = accent.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    params.set('accent', cleaned);
  }
  return `${BADGE_BASE}?${params.toString()}`;
}

function StatCard({
  label,
  value,
  unit,
  colorClass,
}: {
  label: string;
  value: number;
  unit: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] p-3 text-center">
      <span className={`text-lg font-bold font-mono ${colorClass}`}>{value.toLocaleString()}</span>
      <span className="text-[10px] text-gray-500 dark:text-white/35 mt-0.5 leading-tight">
        {label}
      </span>
      <span className="text-[9px] text-gray-400 dark:text-white/20 uppercase tracking-wider">
        {unit}
      </span>
    </div>
  );
}

export function CommitPulseSection({
  githubUsername,
  showCommitPulse,
  commitPulseAccent,
  onGithubUsernameChange,
  onShowCommitPulseChange,
  onCommitPulseAccentChange,
}: CommitPulseSectionProps) {
  const trimmed = githubUsername.trim();
  const debouncedUsername = useDebounce(trimmed, 500);

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [badgeKey, setBadgeKey] = useState(0);
  const [badgeLoaded, setBadgeLoaded] = useState(false);
  const [badgeError, setBadgeError] = useState(false);

  useEffect(() => {
    if (!debouncedUsername) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserDetails(null);
      setFetchError(null);
      setLoading(false);
      setBadgeLoaded(false);
      setBadgeError(false);
      return;
    }

    if (!validateGitHubUsername(debouncedUsername)) {
      setUserDetails(null);
      setFetchError('Invalid username format');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setFetchError(null);
      setUserDetails(null);
      setBadgeLoaded(false);
      setBadgeError(false);
      setBadgeKey((k) => k + 1);

      try {
        const res = await fetch(
          `/api/user-details?username=${encodeURIComponent(debouncedUsername)}`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            res.status === 404 ? 'User not found' : (body.error ?? 'Failed to fetch user')
          );
        }

        const data: UserDetails = await res.json();
        if (!cancelled) setUserDetails(data);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to fetch user');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  const badgeUrl =
    userDetails && !fetchError ? buildBadgeUrl(debouncedUsername, commitPulseAccent) : null;

  const accentIsValid = /^[0-9a-fA-F]{6}$/.test(commitPulseAccent.replace(/^#/, ''));

  const badgeCount = showCommitPulse && trimmed ? 1 : 0;

  return (
    <SectionCard
      title="CommitPulse Badge"
      description="Embed your live 3D contribution streak in the README"
      defaultOpen={true}
      badge={badgeCount}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-white/70">
            Include badge in README
          </p>
          <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">
            Adds your 3D isometric streak monolith after the socials section
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showCommitPulse}
          aria-label="Toggle CommitPulse badge"
          onClick={() => onShowCommitPulseChange(!showCommitPulse)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
            showCommitPulse ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              showCommitPulse ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {showCommitPulse && (
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel>GitHub Username</FieldLabel>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 dark:text-white/25 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => onGithubUsernameChange(e.target.value.trim())}
                placeholder="e.g. OmkarArdekar12"
                maxLength={39}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-9 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
              />
              {githubUsername.length > 0 && (
                <button
                  type="button"
                  onClick={() => onGithubUsernameChange('')}
                  aria-label="Clear username"
                  className="absolute right-3 text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white/70 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mt-2 min-h-[24px]">
              {trimmed.length === 0 ? null : !validateGitHubUsername(trimmed) ? (
                <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  Invalid format — only letters, numbers and hyphens; no leading/trailing hyphen.
                </p>
              ) : loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/40">
                  <Loader2 size={12} className="animate-spin" />
                  Verifying GitHub profile…
                </div>
              ) : fetchError ? (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {fetchError === 'User not found'
                    ? 'GitHub user not found. Check the spelling and try again.'
                    : `Verification failed: ${fetchError}`}
                </p>
              ) : userDetails ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                  <Image
                    src={userDetails.avatar_url}
                    alt={`@${userDetails.login}`}
                    width={22}
                    height={22}
                    className="rounded-full border border-emerald-500/20 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {userDetails.name ?? userDetails.login}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-white/40">
                      @{userDetails.login}
                    </span>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                    Verified
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <FieldLabel>Accent Colour (optional)</FieldLabel>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs text-gray-400 dark:text-white/30 select-none">
                  #
                </span>
                <input
                  type="text"
                  value={commitPulseAccent.replace(/^#/, '')}
                  onChange={(e) => onCommitPulseAccentChange(e.target.value.replace(/^#/, ''))}
                  placeholder="10b981"
                  maxLength={6}
                  spellCheck={false}
                  className="w-32 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 pl-7 pr-3 py-2.5 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-colors"
                />
              </div>
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex-shrink-0 transition-colors"
                style={{
                  background: accentIsValid
                    ? `#${commitPulseAccent.replace(/^#/, '')}`
                    : 'transparent',
                }}
              />
              {commitPulseAccent && !accentIsValid && (
                <p className="text-[11px] text-amber-500">Invalid hex</p>
              )}
              {commitPulseAccent && accentIsValid && (
                <button
                  type="button"
                  onClick={() => onCommitPulseAccentChange('')}
                  className="text-[11px] text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/25 leading-relaxed">
              Overrides the badge tower colour. Leave blank for the default emerald theme.
            </p>
          </div>

          {badgeUrl && userDetails && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Live Preview</FieldLabel>
                <a
                  href={`${DASHBOARD_BASE}/${debouncedUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-500 dark:text-cyan-400 hover:underline"
                >
                  Full dashboard <ExternalLink size={10} />
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
                    Could not load badge preview. The streak data may still be generating — check
                    the full dashboard link above.
                  </p>
                )}
                <img
                  key={`${badgeKey}-${commitPulseAccent}`}
                  src={badgeUrl}
                  alt={`CommitPulse badge for ${debouncedUsername}`}
                  className={`w-full h-auto max-w-[480px] transition-opacity duration-500 ${
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

              {userDetails.stats && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <StatCard
                    label="Current Streak"
                    value={userDetails.stats.currentStreak}
                    unit="days"
                    colorClass="text-orange-400"
                  />
                  <StatCard
                    label="Longest Streak"
                    value={userDetails.stats.longestStreak}
                    unit="days"
                    colorClass="text-amber-400"
                  />
                  <StatCard
                    label="Contributions"
                    value={userDetails.stats.totalContributions}
                    unit="total"
                    colorClass="text-emerald-400"
                  />
                </div>
              )}

              {userDetails.public_repos !== undefined && (
                <p className="text-[11px] text-gray-400 dark:text-white/30 mt-2 text-center">
                  {userDetails.public_repos} public repositories
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
