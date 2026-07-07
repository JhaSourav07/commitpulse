'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Zap, Award, BarChart3, Activity } from 'lucide-react';

interface UnifiedIntelligenceCenterProps {
  profile: {
    username: string;
    developerScore: number;
  };
  stats: {
    totalContributions: number;
    currentStreak: number;
  };
}

export default function UnifiedIntelligenceCenter({
  profile,
  stats,
}: UnifiedIntelligenceCenterProps) {
  // Deterministic cross-metric calculations
  const productivityScore = Math.min(
    100,
    Math.round((stats.totalContributions / 1000) * 100 + stats.currentStreak * 2)
  );
  const communityImpact = Math.min(100, Math.round((profile.developerScore / 100) * 90 + 10));
  const codeQuality = Math.min(
    100,
    Math.round(productivityScore * 0.4 + communityImpact * 0.6 + 15)
  );

  const metrics = [
    {
      name: 'Productivity Velocity',
      value: productivityScore,
      icon: Zap,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
    },
    {
      name: 'Community Impact',
      value: communityImpact,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      name: 'Code Quality & Health',
      value: codeQuality,
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
  ];

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0a0a0a]"
      data-testid="unified-intelligence"
    >
      <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
            <Award className="w-8 h-8 text-purple-500" />
            Executive Intelligence Summary
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cross-referenced analytics combining productivity, quality, and community impact.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Global Score: {profile.developerScore}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`p-5 rounded-xl border border-gray-100 dark:border-gray-800 ${metric.bgColor}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
              <h3 className="font-semibold text-gray-900 dark:text-white">{metric.name}</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </span>
              <span className="text-sm text-gray-500 font-medium mb-1">/ 100</span>
            </div>
            <div className="mt-4 h-2 w-full bg-white/50 dark:bg-black/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                className={`h-full ${metric.bg}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-5 border border-gray-100 dark:border-gray-800 flex items-start gap-4">
        <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg">
          <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">AI Cross-Metric Analysis</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Based on the convergence of your {stats.totalContributions} total contributions and
            consistent streak behavior, your profile demonstrates a highly reliable engineering
            pattern. The correlation between your high productivity and sustained community impact
            suggests a strong maintainer profile with excellent code health habits.
          </p>
        </div>
      </div>
    </div>
  );
}
