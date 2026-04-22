'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp, GitCommit, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Flame,
  TrendingUp,
  GitCommit,
};

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: string;
}

export default function StatsCard({ title, value, description, icon }: StatsCardProps) {
  const IconComponent = iconMap[icon] || Flame;

  // Deterministic chart data based on value length/index for the mini chart
  const baseSeed = title.length;
  const miniChartData = Array.from({ length: 10 }).map((_, i) => 
    ((baseSeed * 17 + i * 31) % 100) + (i > 5 ? 50 : 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            {value}
          </div>
          <p className="text-xs text-white/40 mt-1">{description}</p>
        </div>
        <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-white/5 group-hover:border-cyan-500/30 transition-colors">
          <IconComponent size={20} className="text-cyan-400 group-hover:text-pink-400 transition-colors" />
        </div>
      </div>

      {/* Mini SVG Chart */}
      <div className="w-full h-10 flex items-end justify-between gap-[2px] mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
        {miniChartData.map((h, i) => (
          <div 
            key={i} 
            className="flex-1 bg-gradient-to-t from-cyan-500/20 to-purple-500/80 rounded-t-[2px]" 
            style={{ height: `${Math.max(h, 15)}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}
