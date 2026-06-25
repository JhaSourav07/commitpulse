'use client';

import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import type { RepositoryRisk, RiskLevel } from '@/types/risk';

interface RiskIntelligenceProps {
  data: RepositoryRisk;
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'text-red-500 bg-red-500/10';
    case 'high':
      return 'text-orange-500 bg-orange-500/10';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'low':
      return 'text-emerald-500 bg-emerald-500/10';
  }
}

function RiskScoreCard({ data }: { data: RepositoryRisk }) {
  const { t } = useTranslation();
  const colorClass = getRiskColor(data.overallLevel);

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.risk.overall_score')}
        </h3>
      </div>
      <div className="flex items-center justify-between">
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${colorClass}`}>
          {data.overallLevel}
        </div>
        <div className="text-3xl font-bold text-zinc-900 dark:text-white">{data.overallScore}</div>
      </div>
      <div className="mt-3 text-xs text-zinc-500 dark:text-[#A1A1AA]">{data.repositoryName}</div>
    </div>
  );
}

function CategoryBreakdown({ categories }: { categories: RepositoryRisk['categories'] }) {
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = {
    technical: t('dashboard.risk.technical'),
    security: t('dashboard.risk.security'),
    operational: t('dashboard.risk.operational'),
    compliance: t('dashboard.risk.compliance'),
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.risk.category_breakdown')}
        </h3>
      </div>
      <div className="space-y-3">
        {(
          Object.entries(categories) as [
            keyof typeof categories,
            (typeof categories)[keyof typeof categories],
          ][]
        ).map(([category, data]) => (
          <div key={category}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-zinc-700 dark:text-zinc-300 capitalize">
                {categoryLabels[category] || category}
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                {data.score}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-[#222] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.score}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  data.level === 'critical'
                    ? 'bg-red-500'
                    : data.level === 'high'
                      ? 'bg-orange-500'
                      : data.level === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsCard({
  recommendations,
}: {
  recommendations: RepositoryRisk['recommendations'];
}) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.risk.recommendations')}
        </h3>
      </div>
      <div className="space-y-2">
        {recommendations.slice(0, 3).map((rec, i) => (
          <div key={i} className="p-2 rounded-lg bg-zinc-100 dark:bg-[#111] text-xs">
            <div className="font-semibold text-zinc-900 dark:text-white mb-1">
              {rec.priority}. {rec.title}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">{rec.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskFactorsCard({ factors }: { factors: RepositoryRisk['riskFactors'] }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          {t('dashboard.risk.risk_factors')}
        </h3>
      </div>
      <div className="space-y-2">
        {factors.slice(0, 5).map((factor) => {
          const colorClass = getRiskColor(factor.level);
          return (
            <div
              key={factor.id}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-[#111]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                  {factor.name}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-[#A1A1AA] capitalize">
                  {factor.category}
                </div>
              </div>
              <span
                className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${colorClass}`}
              >
                {factor.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RiskIntelligence({ data }: RiskIntelligenceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-[rgba(255,255,255,0.08)] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <Shield size={15} className="text-zinc-500 dark:text-[#A1A1AA]" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          {data.repositoryName}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RiskScoreCard data={data} />
        <CategoryBreakdown categories={data.categories} />
        <RiskFactorsCard factors={data.riskFactors} />
        <RecommendationsCard recommendations={data.recommendations} />
      </div>
    </motion.div>
  );
}
