'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Flame,
  ShieldAlert,
  Sparkles,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';

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

type SortColumn =
  'username' | 'commitShare' | 'highIntensityWeeks' | 'restWeeks' | 'burnoutScore' | 'totalCommits';
type SortDirection = 'asc' | 'desc';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('burnoutScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedContributors = useMemo(() => {
    return contributors
      .filter((c) => {
        const matchesSearch = c.username.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesHighRisk = !highRiskOnly || c.riskLevel === 'High';
        return matchesSearch && matchesHighRisk;
      })
      .sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortColumn) {
          case 'username':
            valA = a.username.toLowerCase();
            valB = b.username.toLowerCase();
            break;
          case 'totalCommits':
            valA = a.totalCommits;
            valB = b.totalCommits;
            break;
          case 'commitShare':
            valA = a.commitShare;
            valB = b.commitShare;
            break;
          case 'highIntensityWeeks':
            valA = a.highIntensityWeeks;
            valB = b.highIntensityWeeks;
            break;
          case 'restWeeks':
            valA = a.restWeeks;
            valB = b.restWeeks;
            break;
          case 'burnoutScore':
          default:
            valA = a.burnoutScore;
            valB = b.burnoutScore;
            break;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortDirection === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [contributors, searchQuery, highRiskOnly, sortColumn, sortDirection]);

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return (
        <ArrowUpDown size={12} className="opacity-40 hover:opacity-100 transition-opacity ml-1" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={12} className="text-indigo-500 ml-1" />
    ) : (
      <ArrowDown size={12} className="text-indigo-500 ml-1" />
    );
  };

  const highRiskCount = useMemo(
    () => contributors.filter((c) => c.riskLevel === 'High').length,
    [contributors]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Contributor Workload & Burnout Risks
          </h3>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-bold text-gray-500 dark:text-zinc-400 border border-black/5 dark:border-white/5">
            Showing {filteredAndSortedContributors.length} of {contributors.length}
          </span>
        </div>

        {/* Search & High Risk Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="Search contributor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#121212]/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={13}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={() => setHighRiskOnly(!highRiskOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              highRiskOnly
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400 shadow-xs'
                : 'bg-gray-100 dark:bg-zinc-900 border-black/5 dark:border-white/10 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-800'
            }`}
          >
            <ShieldAlert size={13} className={highRiskOnly ? 'text-rose-500' : 'text-gray-400'} />
            <span>High Risk Only</span>
            {highRiskCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-[10px] font-bold">
                {highRiskCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
              <th className="pb-3 pl-1">
                <button
                  onClick={() => handleSort('username')}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  Contributor {renderSortIcon('username')}
                </button>
              </th>

              <th className="pb-3 text-center">
                <button
                  onClick={() => handleSort('commitShare')}
                  className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  Workload Share {renderSortIcon('commitShare')}
                </button>
              </th>

              <th className="pb-3 text-center">Weekly Activity (12w)</th>

              <th className="pb-3 text-center">
                <button
                  onClick={() => handleSort('highIntensityWeeks')}
                  className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  Intensity Weeks {renderSortIcon('highIntensityWeeks')}
                </button>
              </th>

              <th className="pb-3 text-center">
                <button
                  onClick={() => handleSort('restWeeks')}
                  className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  Rest Weeks {renderSortIcon('restWeeks')}
                </button>
              </th>

              <th className="pb-3 text-right pr-1">
                <button
                  onClick={() => handleSort('burnoutScore')}
                  className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-white transition-colors ml-auto"
                >
                  Burnout Risk {renderSortIcon('burnoutScore')}
                </button>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
            {filteredAndSortedContributors.map((c, i) => (
              <motion.tr
                key={c.username}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="group hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Contributor Profile */}
                <td className="py-4 pl-1">
                  <a
                    href={`https://github.com/${c.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
                      <Image
                        src={c.avatarUrl}
                        alt={c.username}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
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
                  </a>
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

        {/* Empty State */}
        {filteredAndSortedContributors.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Filter size={24} className="text-gray-400 mb-2 opacity-60" />
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
              No contributors match your filters
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Try adjusting your search terms or toggling off &quot;High Risk Only&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setHighRiskOnly(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold shadow-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
