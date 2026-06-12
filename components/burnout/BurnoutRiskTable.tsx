'use client';

import { motion } from 'framer-motion';
import { Flame, ShieldAlert, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ContributorMetric {
  username: string;
  avatarUrl: string;
  totalCommits: number;
  commitShare: number;
  burnoutScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  activeWeeks: number;
  highIntensityWeeks: number;
  consecutiveHighWeeks: number;
  restWeeks: number;
  recentTrend: number[];
}

interface BurnoutRiskTableProps {
  contributors: ContributorMetric[];
}

// Custom Pure SVG Sparkline for visual performance
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const width = 120;
  const height = 32;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * (height - 4) - 2;
    return { x, y };
  });

  // Create SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    // Control points for smooth bezier curve
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkline-grad)" />
      <path
        d={pathD}
        fill="none"
        stroke="rgb(99, 102, 241)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BurnoutRiskTable({ contributors }: BurnoutRiskTableProps) {
  const getBadgeStyle = (level: 'Low' | 'Medium' | 'High') => {
    switch (level) {
      case 'High':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.15)]';
      case 'Medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      default:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-6">
        <Flame size={18} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Contributor Workload & Burnout Risks
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="pb-3 pl-1">Contributor</th>
              <th className="pb-3 text-center">Workload Share</th>
              <th className="pb-3 text-center">Weekly Activity (12w)</th>
              <th className="pb-3 text-center">Intensity Weeks</th>
              <th className="pb-3 text-center">Rest Weeks</th>
              <th className="pb-3 text-right pr-1">Burnout Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
            {contributors.map((c, i) => (
              <motion.tr
                key={c.username}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="group hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Contributor Profile */}
                <td className="py-4 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
                      <Image
                        src={c.avatarUrl}
                        alt={c.username}
                        fill
                        sizes="32px"
                        priority={i < 5}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        @{c.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {c.totalCommits.toLocaleString()} commits
                      </span>
                    </div>
                  </div>
                </td>

                {/* Workload Share */}
                <td className="py-4 text-center font-medium text-gray-700 dark:text-zinc-300">
                  {c.commitShare}%
                </td>

                {/* Weekly Activity Sparkline */}
                <td className="py-4 flex justify-center">
                  <div className="py-1">
                    <Sparkline data={c.recentTrend} />
                  </div>
                </td>

                {/* Intensity Weeks */}
                <td className="py-4 text-center text-gray-700 dark:text-zinc-300">
                  <span className={c.highIntensityWeeks > 4 ? 'font-bold text-amber-500' : ''}>
                    {c.highIntensityWeeks} / 12
                  </span>
                </td>

                {/* Rest Weeks */}
                <td className="py-4 text-center text-gray-700 dark:text-zinc-300">
                  <span className={c.restWeeks === 0 ? 'font-bold text-rose-500' : ''}>
                    {c.restWeeks} / 12
                  </span>
                </td>

                {/* Burnout Risk Badge */}
                <td className="py-4 text-right pr-1">
                  <div className="inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider leading-none">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle(c.riskLevel)}`}
                    >
                      {c.riskLevel === 'High' && <ShieldAlert size={10} className="mr-0.5" />}
                      {c.riskLevel === 'Medium' && <Flame size={10} className="mr-0.5" />}
                      {c.riskLevel === 'Low' && <Sparkles size={10} className="mr-0.5" />}
                      {c.burnoutScore}% {c.riskLevel}
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
