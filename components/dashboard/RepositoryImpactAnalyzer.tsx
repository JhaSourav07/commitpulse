'use client';

import { motion } from 'framer-motion';
import { Award, GitFork, Star, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';

export interface RepositoryImpactAnalyzerProps {
  repositories: Array<{
    name: string;
    commits?: number;
    commitCount?: number;
    stars?: number;
    stargazerCount?: number;
    forks?: number;
    forkCount?: number;
    createdAt?: string | Date;
    created_at?: string | Date;
    language?:
      | {
          name: string;
          color: string;
        }
      | string
      | null;
    primaryLanguage?:
      | {
          name: string;
          color: string;
        }
      | string
      | null;
    url?: string;
  }>;
}

export function formatAge(months: number, t: (key: string) => string): string {
  if (months < 12) {
    return `${months} ${t('dashboard.impact.months')}`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    const unit =
      years === 1 ? t('dashboard.impact.years').replace(/s$/, '') : t('dashboard.impact.years');
    return `${years} ${unit}`;
  }
  return `${years}y ${remainingMonths}m`;
}

export default function RepositoryImpactAnalyzer({
  repositories = [],
}: RepositoryImpactAnalyzerProps) {
  const { t } = useTranslation();

  // Handle empty state gracefully
  if (!repositories || repositories.length === 0) {
    return (
      <motion.div
        role="region"
        aria-labelledby="impact-analyzer-title"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-xl bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md border border-gray-200/50 dark:border-neutral-800/50 shadow-md flex flex-col justify-center items-center min-h-[300px]"
      >
        <h3
          id="impact-analyzer-title"
          className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4"
        >
          <Award className="w-5 h-5 text-purple-500" />
          {t('dashboard.impact.title')}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-[#A1A1AA] text-center">
          {t('dashboard.impact.no_data')}
        </p>
      </motion.div>
    );
  }

  // Sanitize and process repositories
  const processedRepos = repositories.map((repo) => {
    const commits = repo.commits ?? repo.commitCount ?? 0;
    const stars = repo.stars ?? repo.stargazerCount ?? 0;
    const forks = repo.forks ?? repo.forkCount ?? 0;

    // Resolve Language name and color
    let langName = 'Unknown';
    let langColor = '#94a3b8'; // default slate-400

    const langObj = repo.primaryLanguage ?? repo.language;
    if (langObj) {
      if (typeof langObj === 'object') {
        langName = langObj.name ?? 'Unknown';
        langColor = langObj.color ?? '#94a3b8';
      } else if (typeof langObj === 'string') {
        langName = langObj;
      }
    }

    // Resolve repository age in months
    const now = new Date();
    const createdRaw = repo.createdAt ?? repo.created_at ?? now;
    const created = new Date(createdRaw);
    const validCreated = isNaN(created.getTime()) ? now : created;
    const diffYears = now.getFullYear() - validCreated.getFullYear();
    const diffMonths = now.getMonth() - validCreated.getMonth();
    // age must be at least 1 month to avoid division by zero
    const ageInMonths = Math.max(1, diffYears * 12 + diffMonths);

    // Calculate impact score: (commits * 3) + (stars * 5) + (forks * 10)
    const score = commits * 3 + stars * 5 + forks * 10;

    const avgStarsPerMonth = parseFloat((stars / ageInMonths).toFixed(2));
    const avgForksPerMonth = parseFloat((forks / ageInMonths).toFixed(2));

    return {
      name: repo.name,
      commits,
      stars,
      forks,
      score,
      ageInMonths,
      avgStarsPerMonth,
      avgForksPerMonth,
      language: {
        name: langName,
        color: langColor,
      },
      url: repo.url ?? '#',
    };
  });

  // Rank Top 5 Repositories based on Score
  const topRepos = [...processedRepos].sort((a, b) => b.score - a.score).slice(0, 5);

  // Group commits by repository language
  const languageGroups: Record<string, { commits: number; color: string }> = {};
  let totalCommits = 0;

  processedRepos.forEach((repo) => {
    const lang = repo.language.name;
    const color = repo.language.color;
    const commits = repo.commits;

    totalCommits += commits;
    if (!languageGroups[lang]) {
      languageGroups[lang] = { commits: 0, color };
    }
    languageGroups[lang].commits += commits;
  });

  const languageContribution = Object.entries(languageGroups)
    .map(([name, data]) => {
      const percentage =
        totalCommits > 0 ? parseFloat(((data.commits / totalCommits) * 100).toFixed(1)) : 0;
      return {
        name,
        commits: data.commits,
        color: data.color,
        percentage,
      };
    })
    .sort((a, b) => b.commits - a.commits);

  // Calculate Overall Growth Metrics
  const totalAgeMonths = processedRepos.reduce((acc, repo) => acc + repo.ageInMonths, 0);
  const avgAgeMonths = processedRepos.length > 0 ? totalAgeMonths / processedRepos.length : 0;
  const totalStars = processedRepos.reduce((acc, repo) => acc + repo.stars, 0);
  const totalForks = processedRepos.reduce((acc, repo) => acc + repo.forks, 0);

  const avgStarsPerMonthOverall =
    totalAgeMonths > 0 ? parseFloat((totalStars / totalAgeMonths).toFixed(2)) : 0;
  const avgForksPerMonthOverall =
    totalAgeMonths > 0 ? parseFloat((totalForks / totalAgeMonths).toFixed(2)) : 0;

  return (
    <motion.div
      role="region"
      aria-labelledby="impact-analyzer-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full p-6 rounded-2xl bg-white/60 dark:bg-neutral-900/40 backdrop-blur-lg border border-gray-200/50 dark:border-neutral-800/50 shadow-xl flex flex-col gap-6"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-gray-200/40 dark:border-neutral-800/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="impact-analyzer-title"
              className="text-base font-bold text-zinc-900 dark:text-white"
            >
              {t('dashboard.impact.title')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('dashboard.impact.growth')} & ranking analysis
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top 5 Repositories ranking */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-500" />
            {t('dashboard.impact.top_repos')}
          </h4>

          <div className="flex flex-col gap-3">
            {topRepos.map((repo, index) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Rank ${index + 1}: ${repo.name}, Impact Score: ${repo.score}`}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200/50 dark:border-neutral-800/40 bg-gray-50/30 hover:bg-gray-100/60 dark:bg-neutral-950/20 dark:hover:bg-neutral-950/50 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {repo.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Language Indicator */}
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: repo.language.color }}
                        />
                        {repo.language.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">•</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {formatAge(repo.ageInMonths, t)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">
                    <div>
                      {repo.commits} {t('dashboard.impact.commits').toLowerCase()}
                    </div>
                    <div>
                      {repo.stars} ★ • {repo.forks} ⑂
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {t('dashboard.impact.score')}
                    </div>
                    <div className="text-xs font-black text-purple-600 dark:text-purple-400 font-mono">
                      {repo.score}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right Column: Language Contribution & Overall Growth Metrics */}
        <div className="flex flex-col gap-6 justify-between">
          {/* Language Contribution */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {t('dashboard.impact.languages')}
            </h4>

            {/* Responsive Segment Bar */}
            <div
              role="img"
              aria-label="Language contribution bar chart showing share of commits"
              className="w-full h-3 rounded-full bg-zinc-200 dark:bg-neutral-800 overflow-hidden flex"
            >
              {languageContribution.map((lang) => (
                <motion.div
                  key={lang.name}
                  initial={{ width: 0 }}
                  animate={{ width: `${lang.percentage}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ backgroundColor: lang.color }}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  title={`${lang.name}: ${lang.percentage}%`}
                />
              ))}
            </div>

            {/* Language Legend */}
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {languageContribution.slice(0, 4).map((lang) => (
                <div
                  key={lang.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-neutral-950/10 border border-gray-100 dark:border-neutral-800/20 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    <span className="text-zinc-600 dark:text-zinc-400 truncate font-medium">
                      {lang.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 ml-1">
                    {lang.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Metrics Summary Cards */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              {t('dashboard.impact.growth')}
            </h4>

            <div className="grid grid-cols-3 gap-3">
              {/* Avg Age */}
              <div className="p-3 rounded-xl border border-gray-200/50 dark:border-neutral-800/30 bg-gray-50/30 dark:bg-neutral-950/10 flex flex-col justify-between">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Age
                </div>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-1.5 truncate">
                  {formatAge(Math.round(avgAgeMonths), t)}
                </div>
              </div>

              {/* Avg Stars / Month */}
              <div className="p-3 rounded-xl border border-gray-200/50 dark:border-neutral-800/30 bg-gray-50/30 dark:bg-neutral-950/10 flex flex-col justify-between">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
                  Stars/Mo
                </div>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-1.5 font-mono">
                  {avgStarsPerMonthOverall}
                </div>
              </div>

              {/* Avg Forks / Month */}
              <div className="p-3 rounded-xl border border-gray-200/50 dark:border-neutral-800/30 bg-gray-50/30 dark:bg-neutral-950/10 flex flex-col justify-between">
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5 text-blue-500" />
                  Forks/Mo
                </div>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-1.5 font-mono">
                  {avgForksPerMonthOverall}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
