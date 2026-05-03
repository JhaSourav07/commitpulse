'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityData } from '@/types/dashboard';

const tabs = ['1W', '1M', '3M', '1Y'];

export default function ActivityLandscape({ data }: { data: ActivityData[] }) {
  const [activeTab, setActiveTab] = useState('3M');

  const getFilteredData = () => {
    let days = 90;
    if (activeTab === '1W') days = 7;
    if (activeTab === '1M') days = 30;
    if (activeTab === '1Y') days = 365;
    const recent = data.slice(-days);
    if (recent.length > 60) {
      const step = Math.ceil(recent.length / 60);
      return recent.filter((_, i) => i % step === 0).slice(-60);
    }
    return recent;
  };

  const displayData = getFilteredData();
  const maxCount = Math.max(...displayData.map((d) => d.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Activity Landscape</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Commit frequency over time</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium transition-all duration-200 border-r border-[rgba(255,255,255,0.08)] last:border-r-0 ${
                activeTab === tab
                  ? 'bg-white text-black'
                  : 'bg-transparent text-[#A1A1AA] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="h-[200px] w-full flex items-end justify-between gap-[2px] relative">
        {displayData.map((day, i) => {
          const heightPercent = Math.max((day.count / maxCount) * 100, 3);
          const isHigh = day.intensity >= 3;

          return (
            <div key={i} className="relative flex-1 flex items-end group/bar h-full">
              {/* Tooltip */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#111] border border-[rgba(255,255,255,0.1)] px-2.5 py-1.5 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none z-20 flex flex-col items-center whitespace-nowrap shadow-xl">
                <span className="text-[10px] text-[#A1A1AA]">{day.date}</span>
                <span className="text-xs font-semibold text-white">{day.count}</span>
              </div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.6, delay: i * 0.008, ease: [0.16, 1, 0.3, 1] }}
                className={`w-full rounded-t-[2px] transition-all duration-200 ${
                  isHigh
                    ? 'bg-white group-hover/bar:bg-white'
                    : day.intensity > 0
                      ? 'bg-zinc-600 group-hover/bar:bg-zinc-400'
                      : 'bg-zinc-800 group-hover/bar:bg-zinc-700'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* X axis */}
      <div className="w-full h-px bg-[rgba(255,255,255,0.06)] mt-3" />
    </motion.div>
  );
}
