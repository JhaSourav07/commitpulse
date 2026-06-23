'use client';

import { motion } from 'framer-motion';
import { Award, Terminal, Code } from 'lucide-react';
import type { TechGrowthEvent } from '@/utils/SkillCalculations';

interface TechnologyGrowthTimelineProps {
  events: TechGrowthEvent[];
}

export default function TechnologyGrowthTimeline({
  events,
}: TechnologyGrowthTimelineProps) {
  const getIcon = (type: TechGrowthEvent['type']) => {
    switch (type) {
      case 'milestone':
        return <Award size={14} className="text-amber-500" />;
      case 'mastery':
        return <Terminal size={14} className="text-purple-500" />;
      default:
        return <Code size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="mt-6">
      <h4 className="text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider mb-4">
        Technology Growth Timeline
      </h4>
      <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 space-y-6">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="relative pl-6"
          >
            {/* Timeline Dot */}
            <div className="absolute -left-3.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {getIcon(event.type)}
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-[#777]">
                {event.date}
              </span>
              <h5 className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                {event.title}
              </h5>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] mt-1">
                {event.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
