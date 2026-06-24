import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Rocket, Calendar } from 'lucide-react';

interface DeveloperGrowthForecastProps {
  stats: {
    totalContributions: number;
    currentStreak: number;
    peakStreak: number;
  };
  joinedDate: string;
}

export default function DeveloperGrowthForecast({
  stats,
  joinedDate,
}: DeveloperGrowthForecastProps) {
  // Deterministic prediction calculation
  const { projectedContributions, nextMilestone, etaMonths } = useMemo(() => {
    const joinedYear = new Date(joinedDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsActive = Math.max(1, currentYear - joinedYear);

    // Base velocity per year
    const velocity = stats.totalContributions / yearsActive;

    // Next year's projected contributions (with a slight 5% growth factor)
    const projectedContributions = Math.round(velocity * 1.05);

    // Calculate next logical milestone (nearest 500 or 1000)
    let nextMilestone = 100;
    if (stats.totalContributions > 100) nextMilestone = 500;
    if (stats.totalContributions > 500) nextMilestone = 1000;
    if (stats.totalContributions > 1000)
      nextMilestone = Math.ceil((stats.totalContributions + 1) / 1000) * 1000;

    // ETA in months
    const remainingToMilestone = nextMilestone - stats.totalContributions;
    const velocityPerMonth = velocity / 12;
    const etaMonths =
      remainingToMilestone > 0
        ? Math.ceil(remainingToMilestone / Math.max(1, velocityPerMonth))
        : 0;

    return { projectedContributions, nextMilestone, etaMonths };
  }, [stats, joinedDate]);

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0a0a0a]"
      data-testid="growth-forecast"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
          Developer Growth Forecast
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 dark:border-gray-800 dark:from-gray-900 dark:to-black relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 opacity-5">
            <Rocket className="h-24 w-24" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">1-Year Projection</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              +{projectedContributions.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">commits</span>
          </div>
          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 inline-flex px-2 py-1 rounded-md">
            +5% Growth Trend
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 dark:border-gray-800 dark:from-gray-900 dark:to-black relative overflow-hidden md:col-span-2"
        >
          <div className="absolute -right-4 -top-4 opacity-5">
            <Target className="h-24 w-24" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Next Major Milestone
          </p>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {nextMilestone.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                Total Contributions
              </span>
            </div>

            {etaMonths > 0 ? (
              <div className="flex-1 flex flex-col items-end">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  ETA: ~{etaMonths} {etaMonths === 1 ? 'month' : 'months'}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-end">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Target className="w-4 h-4" />
                  Milestone Reached!
                </div>
              </div>
            )}
          </div>

          {etaMonths > 0 && (
            <div className="mt-4 h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (stats.totalContributions / nextMilestone) * 100)}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
