'use client';

import { motion } from 'framer-motion';
import { UserMinus, Calendar, AlertCircle, Info } from 'lucide-react';
import Image from 'next/image';

interface InactivityAlert {
  username: string;
  avatarUrl: string;
  previousAvgWeeklyCommits: number;
  weeksSilent: number;
  severity: 'Medium' | 'High';
}

interface InactivityDetectorProps {
  alerts: InactivityAlert[];
}

export default function InactivityDetector({ alerts }: InactivityDetectorProps) {
  if (alerts.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm h-full flex flex-col justify-center items-center text-center">
        <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-3">
          <UserMinus size={20} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          No Inactivity Alerts
        </h3>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
          All active contributors have committed code recently. Knowledge pipeline remains stable.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm flex flex-col gap-4 h-full"
    >
      <div className="flex items-center gap-2">
        <UserMinus size={18} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
          Contributor Inactivity Alerts
        </h3>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[320px] pr-1">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.username}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className={`p-3.5 rounded-xl border flex items-start gap-3.5 relative overflow-hidden ${
              alert.severity === 'High'
                ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border-rose-500/15'
                : 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border-amber-500/15'
            }`}
          >
            {/* Severity Accent Left Border */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${
                alert.severity === 'High' ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />

            <a
              href={`https://github.com/${alert.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-9 h-9 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shrink-0 cursor-pointer"
            >
              <Image
                src={alert.avatarUrl}
                alt={alert.username}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </a>

            <div className="flex flex-col min-w-0">
              <a
                href={`https://github.com/${alert.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sm text-gray-900 dark:text-white truncate hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                @{alert.username}
              </a>
              <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <Calendar size={12} className="shrink-0" />
                Silent for{' '}
                <span className="font-bold text-gray-800 dark:text-zinc-200">
                  {alert.weeksSilent} weeks
                </span>
              </span>
              <span className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <AlertCircle size={12} className="shrink-0" />
                Previously averaged{' '}
                <span className="font-bold text-gray-800 dark:text-zinc-200">
                  {alert.previousAvgWeeklyCommits} commits/week
                </span>
              </span>
            </div>

            <span
              className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border self-center leading-none ${
                alert.severity === 'High'
                  ? 'bg-rose-500/10 border-rose-500/10 text-rose-500'
                  : 'bg-amber-500/10 border-amber-500/10 text-amber-500'
              }`}
            >
              {alert.severity}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5 text-[10px] text-gray-400 flex items-center gap-1.5 leading-relaxed">
        <Info size={12} className="shrink-0" />
        <span>
          Inactivity alerts trigger when active contributors have no commits for 3+ consecutive
          weeks.
        </span>
      </div>
    </motion.div>
  );
}
