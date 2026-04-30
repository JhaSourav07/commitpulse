'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp, GitCommit, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = { Flame, TrendingUp, GitCommit };

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: string;
}

export default function StatsCard({ title, value, description, icon }: StatsCardProps) {
  const IconComponent = iconMap[icon] || Flame;

  const baseSeed = title.length;
  const miniChartData = Array.from({ length: 12 }).map(
    (_, i) => ((baseSeed * 17 + i * 31) % 100) + (i > 6 ? 40 : 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_0_24px_rgba(99,102,241,0.08)] transition-all duration-200 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs text-[#A1A1AA] uppercase tracking-widest font-medium mb-3">{title}</p>
          <p className="text-4xl font-semibold text-white tracking-tight">{value}</p>
          <p className="text-xs text-[#A1A1AA] mt-1.5">{description}</p>
        </div>
        <div className="p-2 rounded-lg bg-[#111] border border-[rgba(255,255,255,0.06)] group-hover:border-[rgba(99,102,241,0.2)] transition-colors duration-200">
          <IconComponent size={18} className="text-[#A1A1AA] group-hover:text-white transition-colors duration-200" />
        </div>
      </div>

      {/* Micro chart */}
      <div className="w-full h-8 flex items-end justify-between gap-px opacity-30 group-hover:opacity-60 transition-opacity duration-300">
        {miniChartData.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-white rounded-t-[1px]"
            style={{ height: `${Math.max(h / 1.4, 10)}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
