'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DependencyRiskCardProps {
  busFactor: number;
  dependencyRisk: 'Low' | 'Medium' | 'High';
  topContributorShare: number;
  topContributorName: string;
}

export default function DependencyRiskCard({
  busFactor,
  dependencyRisk,
  topContributorShare,
  topContributorName,
}: DependencyRiskCardProps) {
  const getRiskDetails = (risk: 'Low' | 'Medium' | 'High') => {
    switch (risk) {
      case 'High':
        return {
          title: 'High Dependency Risk',
          color: 'text-rose-500 dark:text-rose-400',
          bg: 'bg-rose-500/5 dark:bg-rose-500/10',
          border: 'border-rose-500/20',
          icon: ShieldAlert,
          description: `This repository has a critical dependency risk. If @${topContributorName} stops contributing, the project is highly likely to stall or halt immediately.`,
        };
      case 'Medium':
        return {
          title: 'Moderate Dependency Risk',
          color: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-500/5 dark:bg-amber-500/10',
          border: 'border-amber-500/20',
          icon: AlertTriangle,
          description: `Work is concentrated among a small team of ${busFactor} key developer(s). Sharing documentation and key components is highly recommended.`,
        };
      default:
        return {
          title: 'Low Dependency Risk',
          color: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
          border: 'border-emerald-500/20',
          icon: CheckCircle,
          description:
            'Healthy knowledge distribution. The codebase is supported by multiple active contributors, maintaining high resilience.',
        };
    }
  };

  const risk = getRiskDetails(dependencyRisk);
  const RiskIcon = risk.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-2xl border ${risk.border} ${risk.bg} flex flex-col gap-5 h-full`}
    >
      <div className="flex items-center gap-2.5">
        <RiskIcon size={18} className={risk.color} />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Repository Dependency Analysis
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/40 dark:bg-black/30 border border-black/5 dark:border-white/5 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Bus Factor
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {busFactor} {busFactor === 1 ? 'Dev' : 'Devs'}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
            <Info size={10} />
            To reach 70% commits
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white/40 dark:bg-black/30 border border-black/5 dark:border-white/5 flex flex-col">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Workload Concentration
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {topContributorShare}%
          </span>
          <span className="text-[10px] text-gray-400 mt-1 truncate">
            held by @{topContributorName}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mt-auto">
        <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              dependencyRisk === 'High'
                ? 'bg-rose-500'
                : dependencyRisk === 'Medium'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, topContributorShare)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
          {risk.description}
        </p>
      </div>
    </motion.div>
  );
}
